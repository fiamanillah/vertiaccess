import type { Context } from 'hono';
import {
    sendResponse,
    sendPaginatedResponse,
    type CognitoUser,
    AppError,
    HTTPStatusCode,
    config,
    generatePresignedDownloadUrl,
} from '@vertiaccess/core';
import { db } from '@vertiaccess/database';
import Stripe from 'stripe';
import { authService } from '../services/auth.service.ts';

const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
});

// Removed inline S3 setup, now centralized in @vertiaccess/core

// ---------------------------------------------------------------------------
// Helper: resolve presigned URLs inside submittedDocuments array
// ---------------------------------------------------------------------------
async function resolveDocumentUrls(documents: any[], verificationType: string): Promise<any[]> {
    return Promise.all(
        documents.map(async (doc: any) => {
            if (doc.fileKey) {
                try {
                    const downloadUrl = await generatePresignedDownloadUrl(doc.fileKey);
                    return downloadUrl ? { ...doc, downloadUrl } : doc;
                } catch (e) {
                    console.error('Failed to generate presigned URL for key:', doc.fileKey);
                    return doc;
                }
            }
            return doc;
        })
    );
}

// ---------------------------------------------------------------------------
// GET /admin/users
// ---------------------------------------------------------------------------
export async function listUsersHandler(c: Context) {
    const query = c.req.query('query') || c.req.query('search') || '';
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const sortBy = c.req.query('sort') || 'createdAt';
    const sortOrder = c.req.query('sortOrder') || 'desc';

    const where: any = {
        deletedAt: null,
    };

    if (query) {
        where.OR = [
            { email: { contains: query, mode: 'insensitive' } },
            {
                operatorProfile: {
                    fullName: { contains: query, mode: 'insensitive' },
                },
            },
            {
                landownerProfile: {
                    fullName: { contains: query, mode: 'insensitive' },
                },
            },
        ];
    }

    const orderBy: any = {};
    if (sortBy === 'email') {
        orderBy.email = sortOrder;
    } else if (sortBy === 'role') {
        orderBy.role = sortOrder;
    } else if (sortBy === 'status') {
        orderBy.status = sortOrder;
    } else {
        orderBy.createdAt = sortOrder;
    }

    const [users, total] = await Promise.all([
        db.user.findMany({
            where,
            include: {
                operatorProfile: true,
                landownerProfile: true,
            },
            orderBy,
            skip,
            take: limit,
        }),
        db.user.count({ where }),
    ]);

    const formattedUsers = users.map(user => {
        const profile = user.role === 'OPERATOR' ? user.operatorProfile : user.landownerProfile;
        const fullName = profile?.fullName || '';
        const [firstName = '', ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ') || '';

        const frontendStatus = 
            user.status === 'VERIFIED' ? 'active' :
            user.status === 'UNVERIFIED' ? 'pending_verification' :
            user.status === 'SUSPENDED' ? 'suspended' :
            user.status === 'PAYMENT_LOCKED' ? 'payment_locked' : 'inactive';

        return {
            id: user.id,
            email: user.email,
            role: user.role.toLowerCase(),
            firstName: firstName || 'User',
            lastName: lastName || 'Account',
            displayName: fullName || user.email,
            status: frontendStatus,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.createdAt.toISOString(),
        };
    });

    const totalPages = Math.ceil(total / limit);

    return sendPaginatedResponse(c, {
        data: formattedUsers,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
        },
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
    const query = c.req.query('query') || c.req.query('search') || '';

    let siteStatus: string | undefined;
    if (status === 'PENDING') siteStatus = 'UNDER_REVIEW';
    else if (status === 'APPROVED') siteStatus = 'ACTIVE';
    else if (status === 'REJECTED') siteStatus = 'REJECTED';

    const where: any = {
        deletedAt: null
    };
    if (siteStatus) {
        where.status = siteStatus;
    } else {
        where.status = { in: ['UNDER_REVIEW', 'ACTIVE', 'REJECTED'] };
    }

    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { siteReference: { contains: query, mode: 'insensitive' } },
            { vaId: { contains: query, mode: 'insensitive' } },
            {
                landowner: {
                    OR: [
                        { email: { contains: query, mode: 'insensitive' } },
                        {
                            landownerProfile: {
                                fullName: { contains: query, mode: 'insensitive' }
                            }
                        }
                    ]
                }
            }
        ];
    }

    // Fetch sites and total count in parallel
    const [sites, total] = await Promise.all([
        db.site.findMany({
            where,
            include: {
                landowner: {
                    include: {
                        landownerProfile: true,
                    },
                },
                documents: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.site.count({ where }),
    ]);

    // Fetch counts for each status to populate frontend badges
    const baseWhere: any = { deletedAt: null };
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
        db.site.count({ where: { ...baseWhere, status: 'UNDER_REVIEW' } }),
        db.site.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
        db.site.count({ where: { ...baseWhere, status: 'REJECTED' } }),
    ]);

    const formatted = await Promise.all(
        sites.map(async s => {
            const profile = s.landowner?.landownerProfile;
            const docs = s.documents || [];
            
            const formattedDocs = await Promise.all(
                docs.map(async doc => {
                    const docType = doc.documentType || 'general';
                    let downloadUrl = null;
                    try {
                        downloadUrl = await generatePresignedDownloadUrl(doc.fileKey);
                    } catch (e) {
                        console.error('Failed to generate presigned URL for:', doc.fileKey);
                    }
                    return {
                        fileKey: doc.fileKey,
                        fileName: doc.fileName || 'file',
                        fileSize: doc.fileSize || '0',
                        documentType: docType,
                        downloadUrl,
                    };
                })
            );

            return {
                id: s.id,
                type: 'site',
                status: s.status === 'UNDER_REVIEW' ? 'PENDING' : s.status === 'ACTIVE' ? 'APPROVED' : 'REJECTED',
                userId: s.landownerId,
                userEmail: s.landowner?.email,
                userName: profile?.fullName || 'Unknown Landowner',
                userOrganisation: profile?.organisation || 'N/A',
                userRole: 'landowner',
                siteId: s.id,
                siteName: s.name,
                siteReference: s.siteReference || s.vaId || s.id.slice(0, 8).toUpperCase(),
                submittedDocuments: formattedDocs.length > 0 ? formattedDocs : null,
                createdAt: s.createdAt,
                reviewedAt: s.createdAt,
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
        // Check if id is a site id
        const site = await db.site.findUnique({
            where: { id },
            include: {
                landowner: {
                    include: {
                        landownerProfile: true,
                    },
                },
                documents: true,
            },
        });

        if (site) {
            const profile = site.landowner?.landownerProfile;
            const docs = site.documents || [];
            const formattedDocs = await Promise.all(
                docs.map(async doc => {
                    const docType = doc.documentType || 'general';
                    let downloadUrl = null;
                    try {
                        downloadUrl = await generatePresignedDownloadUrl(doc.fileKey);
                    } catch (e) {
                        console.error('Failed to generate presigned URL for:', doc.fileKey);
                    }
                    return {
                        fileKey: doc.fileKey,
                        fileName: doc.fileName || 'file',
                        fileSize: doc.fileSize || '0',
                        documentType: docType,
                        downloadUrl,
                    };
                })
            );

            const meta = (site.geometryMetadata as Record<string, any>) || {};
            const rejectionReasonNote = meta.rejectionReasonNote || meta.adminNote || null;

            const siteDetails = {
                id: site.id,
                name: site.name,
                category: site.siteCategory || 'N/A',
                siteType: site.siteType || 'toal',
                address: site.address,
                postcode: site.postcode,
                latitude: Number(meta.latitude) || 51.505,
                longitude: Number(meta.longitude) || -0.09,
                toalRadius: Number(meta.toalRadius) || 100,
                toalGeometryMode: meta.toalGeometryMode || 'circle',
                allowEmergencyLanding: site.clzEnabled || site.emergencyRecoveryEnabled,
                emergencyRadius: Number(meta.emergencyRadius) || 350,
                emergencyGeometryMode: meta.emergencyGeometryMode || 'circle',
                toalFee: Number(site.toalAccessFee) || 0,
                emergencyFee: Number(site.clzAccessFee) || 0,
                isPermanentActivation: !site.validityEnd,
                activationStartTime: meta.activationStartTime || '08:00',
                activationEndTime: meta.activationEndTime || '20:00',
                bookingApprovalModel: site.autoApprove ? 'auto' : 'manual',
                description: site.description || '',
                photoUrls: formattedDocs
                    .filter(d => d.documentType === 'SITE_PHOTO' || d.documentType === 'photo')
                    .map(d => d.downloadUrl || d.fileKey),
                landowner: {
                    name: profile?.fullName || 'Unknown Landowner',
                    email: site.landowner?.email || '',
                    phone: profile?.contactPhone || site.contactPhone || '',
                },
                policyDocuments: formattedDocs
                    .filter(d => d.documentType === 'SITE_POLICY' || d.documentType === 'policy')
                    .map(d => ({ name: d.fileName, size: `${(Number(d.fileSize) / 1024 / 1024).toFixed(1)} MB`, url: d.downloadUrl })),
                ownershipDocuments: formattedDocs
                    .filter(d => d.documentType === 'SITE_OWNERSHIP' || d.documentType === 'ownership')
                    .map(d => ({ name: d.fileName, size: `${(Number(d.fileSize) / 1024 / 1024).toFixed(1)} MB`, url: d.downloadUrl })),
            };

            const formatted = {
                id: site.id,
                type: 'site',
                status: site.status === 'UNDER_REVIEW' ? 'PENDING' : site.status === 'ACTIVE' ? 'APPROVED' : 'REJECTED',
                userId: site.landownerId,
                userEmail: site.landowner?.email,
                userName: profile?.fullName || 'Unknown Landowner',
                userOrganisation: profile?.organisation || 'N/A',
                userRole: 'landowner',
                siteId: site.id,
                siteName: site.name,
                siteReference: site.siteReference || site.vaId || site.id.slice(0, 8).toUpperCase(),
                submittedDocuments: formattedDocs.length > 0 ? formattedDocs : null,
                createdAt: site.createdAt,
                reviewedAt: site.createdAt,
                rejectionReason: rejectionReasonNote,
                siteDetails,
            };

            return sendResponse(c, {
                data: formatted,
                message: 'Verification retrieved successfully',
            });
        }

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

    const existingVerification = await db.verification.findUnique({
        where: { id },
    });

    if (existingVerification) {
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
        }

        return sendResponse(c, {
            data: verification,
            message: `Verification ${status.toLowerCase()} successfully`,
        });
    }

    // Check if id is a site id
    const site = await db.site.findUnique({
        where: { id },
    });

    if (site) {
        const targetStatus = status === 'APPROVED' ? 'ACTIVE' : 'REJECTED';

        const existingMeta = (site.geometryMetadata as Record<string, unknown>) || {};
        const updatedMeta = {
            ...existingMeta,
            rejectionReasonNote: status === 'REJECTED' ? adminNote : null,
            reviewedAt: new Date().toISOString(),
        };

        const updatedSite = await db.site.update({
            where: { id },
            data: {
                status: targetStatus,
                geometryMetadata: updatedMeta as any,
            },
        });

        // Send a notification to the landowner
        const statusNotificationMap: Record<
            string,
            {
                type: 'success' | 'warning' | 'info' | 'error';
                title: string;
                message: string;
            }
        > = {
            ACTIVE: {
                type: 'success',
                title: 'Site Activated',
                message: `Your site "${updatedSite.name}" has been approved and is now live on the platform.`,
            },
            REJECTED: {
                type: 'error',
                title: 'Site Rejected',
                message: adminNote
                    ? `Your site "${updatedSite.name}" was rejected. Reason: ${adminNote}`
                    : `Your site "${updatedSite.name}" was rejected. Please review and update your submission.`,
            },
        };

        const notificationMeta = statusNotificationMap[targetStatus];
        if (notificationMeta) {
            await db.notification.create({
                data: {
                    userId: updatedSite.landownerId,
                    type: notificationMeta.type,
                    title: notificationMeta.title,
                    message: notificationMeta.message,
                    actionUrl: `/dashboard/landowner`,
                    relatedEntityId: updatedSite.id,
                },
            });
        }

        return sendResponse(c, {
            data: {
                id: updatedSite.id,
                status: status,
                reviewedAt: new Date(),
                rejectionReason: status === 'REJECTED' ? adminNote : null,
            },
            message: `Site verification ${status.toLowerCase()} successfully`,
        });
    }

    throw new AppError({
        statusCode: HTTPStatusCode.NOT_FOUND,
        message: 'Verification request not found',
        code: 'VERIFICATION_NOT_FOUND',
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

    // 2. Update DB — clear lockout fields regardless of previous status
    const updatedUser = await db.user.update({
        where: { id },
        data: {
            status: 'VERIFIED',
            suspendedAt: null,
            suspendedReason: null,
            // Clear payment lockout if account was PAYMENT_LOCKED
            paymentLockedAt: null,
            paymentLockedReason: null,
            overdueBookingId: null,
        },
    });

    return sendResponse(c, {
        data: updatedUser,
        message: 'User has been reinstated successfully',
    });
}

export async function getUserHandler(c: Context) {
    const { id } = c.req.param();
    const user = await db.user.findUnique({
        where: { id },
        include: {
            operatorProfile: true,
            landownerProfile: true,
            subscription: {
                include: {
                    plan: true,
                },
            },
            _count: {
                select: {
                    sitesOwned: true,
                    bookings: true,
                    incidentsReported: true,
                },
            },
        },
    });

    if (!user || user.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'User not found',
            code: 'USER_NOT_FOUND',
        });
    }

    const profile = user.role === 'OPERATOR' ? user.operatorProfile : user.landownerProfile;
    const fullName = profile?.fullName || '';
    const [firstName = '', ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const frontendStatus =
        user.status === 'VERIFIED' ? 'active' :
        user.status === 'UNVERIFIED' ? 'pending_verification' :
        user.status === 'SUSPENDED' ? 'suspended' :
        user.status === 'PAYMENT_LOCKED' ? 'payment_locked' : 'inactive';

    const formatted = {
        id: user.id,
        email: user.email,
        role: user.role.toLowerCase(),
        firstName: firstName || 'User',
        lastName: lastName || 'Account',
        displayName: fullName || user.email,
        organisation: profile?.organisation || '',
        contactPhone: profile?.contactPhone || '',
        flyerId: user.role === 'OPERATOR' ? (user.operatorProfile?.flyerId || '') : '',
        status: frontendStatus,
        suspendedReason: user.suspendedReason || '',
        createdAt: user.createdAt.toISOString(),
        activity: {
            sitesCount: user._count.sitesOwned,
            bookingsCount: user._count.bookings,
            incidentsCount: user._count.incidentsReported,
        },
        subscription: user.subscription ? {
            id: user.subscription.id,
            planName: user.subscription.plan.name,
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() || null,
        } : null,
    };

    return sendResponse(c, {
        data: formatted,
        message: 'User retrieved successfully',
    });
}

export async function updateUserRoleHandler(c: Context) {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { role } = body as { role: 'admin' | 'operator' | 'landowner' };

    if (!['admin', 'operator', 'landowner'].includes(role)) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Invalid role specified',
            code: 'INVALID_ROLE',
        });
    }

    const user = await db.user.findUnique({
        where: { id },
    });

    if (!user || user.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'User not found',
            code: 'USER_NOT_FOUND',
        });
    }

    // 1. Update in Cognito
    try {
        await authService.adminUpdateUserRole(user.email, role);
    } catch (error) {
        console.error('Failed to update Cognito role:', error);
    }

    // 2. Update role in DB
    const updated = await db.user.update({
        where: { id },
        data: {
            role: role.toUpperCase() as any,
        },
    });

    return sendResponse(c, {
        data: {
            id: updated.id,
            role: updated.role.toLowerCase(),
        },
        message: 'User role updated successfully',
    });
}

export async function deleteUserHandler(c: Context) {
    const { id } = c.req.param();

    const user = await db.user.findUnique({
        where: { id },
    });

    if (!user || user.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'User not found',
            code: 'USER_NOT_FOUND',
        });
    }

    // 1. Disable in Cognito and sign out
    try {
        await authService.adminDisableUser(user.email);
        await authService.adminUserGlobalSignOut(user.email);
    } catch (error) {
        console.error('Failed to disable Cognito user during deletion:', error);
    }

    // 2. Soft delete in DB
    await db.user.update({
        where: { id },
        data: {
            deletedAt: new Date(),
        },
    });

    return sendResponse(c, {
        message: 'User deleted successfully',
    });
}

