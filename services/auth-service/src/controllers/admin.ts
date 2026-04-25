import type { Context } from 'hono';
import { sendResponse, type CognitoUser } from '@vertiaccess/core';
import { db } from '@vertiaccess/database';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.APP_AWS_REGION || process.env.AWS_REGION || 'us-east-2',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'site-documents-398069593036-us-east-2';

// ---------------------------------------------------------------------------
// Helper: generate a presigned S3 URL for a given fileKey
// ---------------------------------------------------------------------------
async function generatePresignedUrl(fileKey: string): Promise<string | null> {
    try {
        const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (err) {
        console.error('Failed to generate presigned URL for key:', fileKey, err);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Helper: resolve presigned URLs inside submittedDocuments array
// ---------------------------------------------------------------------------
async function resolveDocumentUrls(documents: any[]): Promise<any[]> {
    return Promise.all(
        documents.map(async (doc: any) => {
            if (doc.fileKey) {
                const downloadUrl = await generatePresignedUrl(doc.fileKey);
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
// GET /admin/verifications
// ---------------------------------------------------------------------------
export async function listVerificationsHandler(c: Context) {
    const verifications = await db.verification.findMany({
        include: {
            user: {
                include: {
                    operatorProfile: true,
                    landownerProfile: true,
                },
            },
            site: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    const formatted = await Promise.all(
        verifications.map(async v => {
            const isOperator = v.user?.role === 'OPERATOR';
            const profile = isOperator ? v.user?.operatorProfile : v.user?.landownerProfile;

            const submittedDocs = Array.isArray(v.submittedDocuments) ? v.submittedDocuments : [];

            // Resolve presigned URLs only for documents that have a fileKey (landowner identity docs)
            const formattedDocs = await resolveDocumentUrls(submittedDocs);

            return {
                id: v.id,
                type: v.type,
                status: v.status,
                userId: v.userId,
                userEmail: v.user?.email,
                userName: profile?.fullName,
                userOrganisation: profile?.organisation,
                userRole: v.user?.role?.toLowerCase() ?? null, // included for clean frontend filtering
                flyerId:
                    v.user?.role === 'OPERATOR' ? (v.user?.operatorProfile?.flyerId ?? null) : null,
                submittedDocuments: formattedDocs.length > 0 ? formattedDocs : null,
                createdAt: v.createdAt,
                reviewedAt: v.reviewedAt,
            };
        })
    );

    return sendResponse(c, {
        data: formatted,
        message: 'Verifications retrieved successfully',
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
