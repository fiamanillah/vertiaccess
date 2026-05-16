import type { Context } from 'hono';
import {
    sendResponse,
    sendPaginatedResponse,
    type CognitoUser,
    AppError,
    HTTPStatusCode,
    config,
} from '@vertiaccess/core';
import { db } from '@vertiaccess/database';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Stripe from 'stripe';
import { authService } from '../services/auth.service.ts';

const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
});

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
});

// Update these to match the actual existing buckets
const PUBLIC_BUCKET_NAME = process.env.PUBLIC_S3_BUCKET || 'vertiaccess-fiamanillah-sitedocumentsbucket-rfhsbuat';
const PRIVATE_BUCKET_NAME = process.env.PRIVATE_S3_BUCKET || 'vertiaccess-fiamanillah-privatedocumentsbucket-mmsfmshn';

/**
 * Helper to determine which bucket a file belongs to based on its key or verification type
 */
function getBucketForVerification(type: string): string {
    // Identity and site documents are usually private
    if (type === 'identity' || type === 'operator' || type === 'site') {
        return PRIVATE_BUCKET_NAME;
    }
    return PUBLIC_BUCKET_NAME;
}

// ---------------------------------------------------------------------------
// Helper: generate a presigned S3 URL for a given fileKey
// ---------------------------------------------------------------------------
async function generatePresignedUrl(fileKey: string, bucketName: string): Promise<string | null> {
    try {
        const command = new GetObjectCommand({ Bucket: bucketName, Key: fileKey });
        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (err) {
        console.error('Failed to generate presigned URL for key:', fileKey, err);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Helper: resolve presigned URLs inside submittedDocuments array
// ---------------------------------------------------------------------------
async function resolveDocumentUrls(documents: any[], verificationType: string): Promise<any[]> {
    const bucketName = getBucketForVerification(verificationType);
    return Promise.all(
        documents.map(async (doc: any) => {
            if (doc.fileKey) {
                const downloadUrl = await generatePresignedUrl(doc.fileKey, bucketName);
                return downloadUrl ? { ...doc, downloadUrl } : doc;
            }
            return doc;
        })
    );
}

// ---------------------------------------------------------------------------
// GET /admin/users
// ---------------------------------------------------------------------------
export async function listUsersHandler(c: Context) {
    const users = await db.user.findMany({
        include: {
            operatorProfile: true,
            landownerProfile: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map(user => {
        const profile = user.role === 'OPERATOR' ? user.operatorProfile : user.landownerProfile;
        return {
            id: user.id,
            email: user.email,
            role: user.role.toLowerCase(),
            name: profile?.fullName || '',
            organisation: profile?.organisation || '',
            verificationStatus: user.status,
            verifiedDate: user.createdAt,
            activeSites: 0,
            totalBookings: 0,
        };
    });

    return sendResponse(c, {
        data: formattedUsers,
        message: 'Users retrieved successfully',
    });
}

// ---------------------------------------------------------------------------
// GET /admin/verifications/users
// ---------------------------------------------------------------------------
export async function listUserVerificationsHandler(c: Context) {
    const status = c.req.query('status');
    const userRole = c.req.query('role');
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {
        type: { in: ['identity', 'operator', 'landowner'] }
    };
    if (status) {
        where.status = status;
    }
    if (userRole) {
        where.user = {
            role: userRole.toUpperCase(),
        };
    }

    // Fetch verifications and total count in parallel
    const [verifications, total] = await Promise.all([
        db.verification.findMany({
            where,
            include: {
                user: {
                    include: {
                        operatorProfile: true,
                        landownerProfile: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.verification.count({ where }),
    ]);

    // Fetch counts for each status to populate frontend badges
    const countWhere: any = {
        type: { in: ['identity', 'operator', 'landowner'] }
    };
    if (userRole) {
        countWhere.user = { role: userRole.toUpperCase() };
    }

    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
        db.verification.count({ where: { ...countWhere, status: 'PENDING' } }),
        db.verification.count({ where: { ...countWhere, status: 'APPROVED' } }),
        db.verification.count({ where: { ...countWhere, status: 'REJECTED' } }),
    ]);

    const formatted = await Promise.all(
        verifications.map(async v => {
            const isOperator = v.user?.role === 'OPERATOR';
            const profile = isOperator ? v.user?.operatorProfile : v.user?.landownerProfile;

            const submittedDocs = Array.isArray(v.submittedDocuments) ? v.submittedDocuments : [];
            const formattedDocs = await resolveDocumentUrls(submittedDocs, v.type);

            return {
                id: v.id,
                type: v.type,
                status: v.status,
                userId: v.userId,
                userEmail: v.user?.email,
                userName: profile?.fullName,
                userOrganisation: profile?.organisation,
                userRole: v.user?.role?.toLowerCase() ?? null,
                flyerId:
                    v.user?.role === 'OPERATOR' ? (v.user?.operatorProfile?.flyerId ?? null) : null,
                submittedDocuments: formattedDocs.length > 0 ? formattedDocs : null,
                createdAt: v.createdAt,
                reviewedAt: v.reviewedAt,
            };
        })
    );

    const totalPages = Math.ceil(total / limit);

    return sendPaginatedResponse(c, {
        data: formatted,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
        },
        extraMeta: {
            counts: {
                PENDING: pendingCount,
                APPROVED: approvedCount,
                REJECTED: rejectedCount,
            },
        },
        message: 'User verifications retrieved successfully',
    });
}

// ---------------------------------------------------------------------------
// GET /admin/verifications/sites
// ---------------------------------------------------------------------------
export async function listSiteVerificationsHandler(c: Context) {
    const status = c.req.query('status');
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {
        type: 'site'
    };
    if (status) {
        where.status = status;
    }

    // Fetch verifications and total count in parallel
    const [verifications, total] = await Promise.all([
        db.verification.findMany({
            where,
            include: {
                user: {
                    include: {
                        landownerProfile: true,
                    },
                },
                site: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.verification.count({ where }),
    ]);

    // Fetch counts for each status to populate frontend badges
    const countWhere: any = {
        type: 'site'
    };

    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
        db.verification.count({ where: { ...countWhere, status: 'PENDING' } }),
        db.verification.count({ where: { ...countWhere, status: 'APPROVED' } }),
        db.verification.count({ where: { ...countWhere, status: 'REJECTED' } }),
    ]);

    const formatted = await Promise.all(
        verifications.map(async v => {
            const profile = v.user?.landownerProfile;

            const submittedDocs = Array.isArray(v.submittedDocuments) ? v.submittedDocuments : [];
            const formattedDocs = await resolveDocumentUrls(submittedDocs, v.type);

            return {
                id: v.id,
                type: v.type,
                status: v.status,
                userId: v.userId,
                userEmail: v.user?.email,
                userName: profile?.fullName,
                userOrganisation: profile?.organisation,
                userRole: v.user?.role?.toLowerCase() ?? null,
                siteId: v.site?.id,
                siteName: v.site?.name,
                siteReference: v.site?.siteReference,
                submittedDocuments: formattedDocs.length > 0 ? formattedDocs : null,
                createdAt: v.createdAt,
                reviewedAt: v.reviewedAt,
            };
        })
    );

    const totalPages = Math.ceil(total / limit);

    return sendPaginatedResponse(c, {
        data: formatted,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
        },
        extraMeta: {
            counts: {
                PENDING: pendingCount,
                APPROVED: approvedCount,
                REJECTED: rejectedCount,
            },
        },
        message: 'Site verifications retrieved successfully',
    });
}

// ---------------------------------------------------------------------------
// GET /admin/verifications/:id
// ---------------------------------------------------------------------------
export async function getVerificationHandler(c: Context) {
    const { id } = c.req.param();

    const v = await db.verification.findUnique({
        where: { id },
        include: {
            user: {
                include: {
                    operatorProfile: true,
                    landownerProfile: true,
                },
            },
            site: true,
        },
    });

    if (!v) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Verification request not found',
            code: 'VERIFICATION_NOT_FOUND',
        });
    }

    const isOperator = v.user?.role === 'OPERATOR';
    const profile = isOperator ? v.user?.operatorProfile : v.user?.landownerProfile;

    const submittedDocs = Array.isArray(v.submittedDocuments) ? v.submittedDocuments : [];

    // Resolve presigned URLs for all documents
    const formattedDocs = await resolveDocumentUrls(submittedDocs, v.type);

    const formatted = {
        id: v.id,
        type: v.type,
        status: v.status,
        userId: v.userId,
        userEmail: v.user?.email,
        userName: profile?.fullName,
        userOrganisation: profile?.organisation,
        userRole: v.user?.role?.toLowerCase() ?? null,
        flyerId: v.user?.role === 'OPERATOR' ? (v.user?.operatorProfile?.flyerId ?? null) : null,
        submittedDocuments: formattedDocs.length > 0 ? formattedDocs : null,
        createdAt: v.createdAt,
        reviewedAt: v.reviewedAt,
    };

    return sendResponse(c, {
        data: formatted,
        message: 'Verification retrieved successfully',
    });
}

// ---------------------------------------------------------------------------
// PUT /admin/verifications/:id
// ---------------------------------------------------------------------------
export async function updateVerificationHandler(c: Context) {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { status, adminNote } = body as {
        status: 'APPROVED' | 'REJECTED';
        adminNote?: string;
    };

    const verification = await db.verification.update({
        where: { id },
        data: {
            status,
            reviewedAt: new Date(),
            rejectionReason: status === 'REJECTED' ? adminNote : null,
        },
    });

    const isIdentityType = verification.type === 'identity';
    const isOperatorType = verification.type === 'operator';
    const isUserVerification = isIdentityType || isOperatorType;

    // Update the user's account status when approving or rejecting a user verification
    if (verification.userId && isUserVerification) {
        if (status === 'APPROVED') {
            await db.user.update({
                where: { id: verification.userId },
                data: { status: 'VERIFIED' },
            });
        } else if (status === 'REJECTED') {
            // Reset to UNVERIFIED so the user can resubmit
            await db.user.update({
                where: { id: verification.userId },
                data: { status: 'UNVERIFIED' },
            });
        }
    }

    // Send a notification to the user
    if (verification.userId) {
        const dashboardUrl = isOperatorType ? '/dashboard/operator' : '/dashboard/landowner';

        const approvedTitle = isOperatorType
            ? 'Operator Verification Approved'
            : 'Verification Approved';
        const rejectedTitle = isOperatorType
            ? 'Operator Verification Requires Action'
            : 'Verification Requires Action';

        const approvedMessage = isOperatorType
            ? 'Your operator credentials have been verified. You now have full operator access.'
            : 'Your identity has been verified. Your account access has been upgraded.';

        const rejectedMessage = adminNote
            ? `Your verification was rejected: ${adminNote}`
            : isOperatorType
              ? 'Your operator verification was rejected. Please review your credentials and resubmit.'
              : 'Your verification was rejected. Please review your documents and resubmit.';

        await db.notification.create({
            data: {
                userId: verification.userId,
                type: status === 'APPROVED' ? 'success' : 'warning',
                title: status === 'APPROVED' ? approvedTitle : rejectedTitle,
                message: status === 'APPROVED' ? approvedMessage : rejectedMessage,
                actionUrl: dashboardUrl,
                relatedEntityId: verification.id,
            },
        });

        // TODO: Implement email sending logic here once email provider (e.g., AWS SES) is confirmed.
        // Expected variables for email template:
        // const userEmail = (await db.user.findUnique({ where: { id: verification.userId } }))?.email;
        // const emailData = {
        //   to: userEmail,
        //   subject: status === 'APPROVED' ? approvedTitle : rejectedTitle,
        //   message: status === 'APPROVED' ? approvedMessage : rejectedMessage,
        //   actionUrl: dashboardUrl,
        //   adminNote: adminNote || '',
        // };
        // await emailService.sendVerificationStatusEmail(emailData);
    }

    return sendResponse(c, {
        data: verification,
        message: `Verification ${status.toLowerCase()} successfully`,
    });
}

// ---------------------------------------------------------------------------
// POST /admin/users/:id/suspend
// ---------------------------------------------------------------------------
export async function suspendUserHandler(c: Context) {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { reason } = body as { reason: string };

    const user = await db.user.findUnique({
        where: { id },
        include: { subscription: true },
    });

    if (!user) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'User not found',
            code: 'USER_NOT_FOUND',
        });
    }

    // 1. Cancel Stripe subscription if active
    if (user.subscription?.stripeSubscriptionId && user.subscription.status === 'active') {
        try {
            await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
            await db.userSubscription.update({
                where: { id: user.subscription.id },
                data: { status: 'canceled', cancelAtPeriodEnd: true },
            });
        } catch (error) {
            console.error('Failed to cancel Stripe subscription during suspend:', error);
            // Non-fatal, continue with suspension
        }
    }

    // 2. Disable user in Cognito and global sign out
    try {
        await authService.adminDisableUser(user.email);
        await authService.adminUserGlobalSignOut(user.email);
    } catch (error) {
        console.error('Failed to disable Cognito user during suspend:', error);
        // Non-fatal, DB status takes precedence
    }

    // 3. Update DB
    const updatedUser = await db.user.update({
        where: { id },
        data: {
            status: 'SUSPENDED',
            suspendedAt: new Date(),
            suspendedReason: reason,
        },
    });

    return sendResponse(c, {
        data: updatedUser,
        message: 'User has been suspended successfully',
    });
}

// ---------------------------------------------------------------------------
// POST /admin/users/:id/reinstate
// ---------------------------------------------------------------------------
export async function reinstateUserHandler(c: Context) {
    const { id } = c.req.param();

    const user = await db.user.findUnique({
        where: { id },
    });

    if (!user) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'User not found',
            code: 'USER_NOT_FOUND',
        });
    }

    // 1. Enable user in Cognito
    try {
        await authService.adminEnableUser(user.email);
    } catch (error) {
        console.error('Failed to enable Cognito user during reinstate:', error);
        // Non-fatal
    }

    // 2. Update DB
    const updatedUser = await db.user.update({
        where: { id },
        data: {
            status: 'VERIFIED',
            suspendedAt: null,
            suspendedReason: null,
        },
    });

    return sendResponse(c, {
        data: updatedUser,
        message: 'User has been reinstated successfully',
    });
}
