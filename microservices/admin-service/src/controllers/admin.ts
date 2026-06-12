import type { Context } from 'hono';
import {
    sendResponse,
    sendPaginatedResponse,
    sendCreatedResponse,
    type CognitoUser,
    AppError,
    HTTPStatusCode,
    config,
    generatePresignedDownloadUrl,
    generateVAID,
    recordAuditLog,
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
                assetManagerProfile: {
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
    } else if (sortBy === 'lastLogin' || sortBy === 'lastLoginAt') {
        orderBy.lastLoginAt = sortOrder;
    } else {
        orderBy.createdAt = sortOrder;
    }

    const [users, total] = await Promise.all([
        db.user.findMany({
            where,
            include: {
                operatorProfile: true,
                assetManagerProfile: true,
            },
            orderBy,
            skip,
            take: limit,
        }),
        db.user.count({ where }),
    ]);

    const formattedUsers = users.map(user => {
        const profile = user.role === 'OPERATOR' ? user.operatorProfile : user.assetManagerProfile;
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
            organisation: profile?.organisation || 'N/A',
            lastLogin: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
            suspendedUntil: user.suspendedUntil ? user.suspendedUntil.toISOString() : null,
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
        type: { in: ['identity', 'operator', 'assetmanager'] }
    };
    if (status) {
        where.status = status;
    }
    if (userRole) {
        where.user = {
            role: userRole.toUpperCase(),
        };
    }

    const orderBy: any = {};
    if (status === 'PENDING') {
        orderBy.createdAt = 'asc';
    } else if (status === 'APPROVED' || status === 'REJECTED') {
        orderBy.reviewedAt = 'desc';
    } else {
        orderBy.createdAt = 'desc';
    }

    // Fetch verifications and total count in parallel
    const [verifications, total] = await Promise.all([
        db.verification.findMany({
            where,
            include: {
                user: {
                    include: {
                        operatorProfile: true,
                        assetManagerProfile: true,
                    },
                },
            },
            orderBy,
            skip,
            take: limit,
        }),
        db.verification.count({ where }),
    ]);

    // Fetch counts for each status to populate frontend badges
    const countWhere: any = {
        type: { in: ['identity', 'operator', 'assetmanager'] }
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
            const profile = isOperator ? v.user?.operatorProfile : v.user?.assetManagerProfile;

            const submittedDocs = Array.isArray(v.submittedDocuments) ? v.submittedDocuments : [];
            const formattedDocs = await resolveDocumentUrls(submittedDocs, v.type);

            return {
                id: v.id,
                type: v.type,
                status: v.status,
                userId: v.userId,
                userVaId: profile?.vaId || null,
                userEmail: v.user?.email,
                userName: profile?.fullName,
                userOrganisation: profile?.organisation,
                userRole: v.user?.role?.toLowerCase() ?? null,
                flyerId:
                    v.user?.role === 'OPERATOR' ? (v.user?.operatorProfile?.flyerId ?? null) : null,
                submittedDocuments: formattedDocs.length > 0 ? formattedDocs : null,
                createdAt: v.createdAt,
                reviewedAt: v.reviewedAt,
                accountStatus: v.user?.status ?? null,
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
                assetManager: {
                    OR: [
                        { email: { contains: query, mode: 'insensitive' } },
                        {
                            assetManagerProfile: {
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
                assetManager: {
                    include: {
                        assetManagerProfile: true,
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
            const profile = s.assetManager?.assetManagerProfile;
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
                userId: s.assetManagerId,
                userEmail: s.assetManager?.email,
                userName: profile?.fullName || 'Unknown AssetManager',
                userOrganisation: profile?.organisation || 'N/A',
                userRole: 'assetmanager',
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
                    assetManagerProfile: true,
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
                assetManager: {
                    include: {
                        assetManagerProfile: true,
                    },
                },
                documents: true,
            },
        });

        if (site) {
            const profile = site.assetManager?.assetManagerProfile;
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

            const geom = meta.geometry || {};
            const clzGeom = meta.clzGeometry || {};

            const toalPolygonPoints =
                geom.type === 'polygon' && geom.points
                    ? geom.points.map((p: any) => [p.lat, p.lng])
                    : [];

            const emergencyPolygonPoints =
                clzGeom.type === 'polygon' && clzGeom.points
                    ? clzGeom.points.map((p: any) => [p.lat, p.lng])
                    : [];

            const siteDetails = {
                id: site.id,
                name: site.name,
                category: site.siteCategory || 'N/A',
                siteType: site.siteType || 'toal',
                address: site.address,
                postcode: site.postcode,
                latitude: Number(geom.center?.lat) || 51.505,
                longitude: Number(geom.center?.lng) || -0.09,
                toalRadius: Number(geom.radius) || 100,
                toalGeometryMode: geom.type || 'circle',
                toalPolygonPoints,
                allowEmergencyLanding: site.clzEnabled || site.emergencyRecoveryEnabled,
                emergencyRadius: Number(clzGeom.radius) || 350,
                emergencyGeometryMode: clzGeom.type || 'circle',
                emergencyPolygonPoints,
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
                assetManager: {
                    name: profile?.fullName || 'Unknown AssetManager',
                    email: site.assetManager?.email || '',
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
                userId: site.assetManagerId,
                userEmail: site.assetManager?.email,
                userName: profile?.fullName || 'Unknown AssetManager',
                userOrganisation: profile?.organisation || 'N/A',
                userRole: 'assetmanager',
                siteId: site.id,
                siteName: site.name,
                siteReference: site.siteReference || site.vaId || site.id.slice(0, 8).toUpperCase(),
                submittedDocuments: formattedDocs.length > 0 ? formattedDocs : null,
                createdAt: site.createdAt,
                reviewedAt: site.createdAt,
                rejectionReason: rejectionReasonNote,
                siteDetails,
                accountStatus: site.assetManager?.status ?? null,
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
    const profile = isOperator ? v.user?.operatorProfile : v.user?.assetManagerProfile;

    const submittedDocs = Array.isArray(v.submittedDocuments) ? v.submittedDocuments : [];

    // Resolve presigned URLs for all documents
    const formattedDocs = await resolveDocumentUrls(submittedDocs, v.type);

    const formatted = {
        id: v.id,
        type: v.type,
        status: v.status,
        userId: v.userId,
        userVaId: profile?.vaId || null,
        userEmail: v.user?.email,
        userName: profile?.fullName,
        userOrganisation: profile?.organisation,
        userRole: v.user?.role?.toLowerCase() ?? null,
        flyerId: v.user?.role === 'OPERATOR' ? (v.user?.operatorProfile?.flyerId ?? null) : null,
        submittedDocuments: formattedDocs.length > 0 ? formattedDocs : null,
        createdAt: v.createdAt,
        reviewedAt: v.reviewedAt,
        accountStatus: v.user?.status ?? null,
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
    const currentUser = c.get('cognitoUser') as CognitoUser | undefined;
    const adminId = currentUser?.sub || 'system';
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
                await recordAuditLog(undefined, {
                    entityType: 'user',
                    entityId: verification.userId,
                    eventType: 'user.verified',
                    actorType: 'admin',
                    actorId: adminId,
                    metadata: { verificationId: verification.id, verificationType: verification.type },
                });
            } else if (status === 'REJECTED') {
                // Reset to UNVERIFIED so the user can resubmit
                await db.user.update({
                    where: { id: verification.userId },
                    data: { status: 'UNVERIFIED' },
                });
                await recordAuditLog(undefined, {
                    entityType: 'user',
                    entityId: verification.userId,
                    eventType: 'user.verification_rejected',
                    actorType: 'admin',
                    actorId: adminId,
                    metadata: { verificationId: verification.id, verificationType: verification.type, reason: adminNote },
                });
            }
        }

        // Send a notification to the user
        if (verification.userId) {
            const dashboardUrl = isOperatorType ? '/dashboard/operator' : '/dashboard/assetmanager';

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
                    actionUrl: status === 'REJECTED' ? '/dashboard/profile' : dashboardUrl,
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

        await recordAuditLog(undefined, {
            siteId: updatedSite.id,
            entityType: 'site',
            entityId: updatedSite.id,
            eventType: 'site.status_changed',
            actorType: 'admin',
            actorId: adminId,
            previousState: { status: site.status },
            newState: { status: updatedSite.status },
            metadata: { reason: adminNote || null },
        });

        // Send a notification to the assetmanager
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
                    userId: updatedSite.assetManagerId,
                    type: notificationMeta.type,
                    title: notificationMeta.title,
                    message: notificationMeta.message,
                    actionUrl: targetStatus === 'ACTIVE'
                        ? `/dashboard/assetmanager/infrastructure`
                        : `/dashboard/assetmanager/infrastructure/edit/${updatedSite.id}`,
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
    const currentUser = c.get('cognitoUser') as CognitoUser | undefined;
    const adminId = currentUser?.sub || 'system';
    const { id } = c.req.param();
    const body = await c.req.json();
    const { reason, durationDays } = body as { reason: string; durationDays?: number };

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

    // 2. Global sign out to invalidate current session tokens (but do NOT disable in Cognito so they can log in to view status)
    try {
        await authService.adminUserGlobalSignOut(user.email);
    } catch (error) {
        console.error('Failed to global sign out Cognito user during suspend:', error);
        // Non-fatal
    }

    const suspendedUntil = durationDays ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null;

    // 3. Update DB
    const updatedUser = await db.user.update({
        where: { id },
        data: {
            status: 'SUSPENDED',
            suspendedAt: new Date(),
            suspendedReason: reason,
            suspendedUntil,
        },
    });

    await recordAuditLog(undefined, {
        entityType: 'user',
        entityId: id || '',
        eventType: 'user.suspended',
        actorType: 'admin',
        actorId: adminId,
        previousState: { status: user.status },
        newState: { status: 'SUSPENDED', suspendedUntil: suspendedUntil?.toISOString() || null, reason },
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
    const currentUser = c.get('cognitoUser') as CognitoUser | undefined;
    const adminId = currentUser?.sub || 'system';
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
            suspendedUntil: null,
            // Clear payment lockout if account was PAYMENT_LOCKED
            paymentLockedAt: null,
            paymentLockedReason: null,
            overdueBookingId: null,
        },
    });

    await recordAuditLog(undefined, {
        entityType: 'user',
        entityId: id || '',
        eventType: 'user.reinstated',
        actorType: 'admin',
        actorId: adminId,
        previousState: { status: user.status },
        newState: { status: 'VERIFIED' },
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
            assetManagerProfile: true,
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

    const profile = user.role === 'OPERATOR' ? user.operatorProfile : user.assetManagerProfile;
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
        lastLogin: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        suspendedUntil: user.suspendedUntil ? user.suspendedUntil.toISOString() : null,
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
    const currentUser = c.get('cognitoUser') as CognitoUser | undefined;
    const adminId = currentUser?.sub || 'system';
    const { id } = c.req.param();
    const body = await c.req.json();
    const { role } = body as { role: 'admin' | 'operator' | 'assetmanager' };

    if (!['admin', 'operator', 'assetmanager'].includes(role)) {
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

    await recordAuditLog(undefined, {
        entityType: 'user',
        entityId: id || '',
        eventType: 'user.role_updated',
        actorType: 'admin',
        actorId: adminId,
        previousState: { role: user.role },
        newState: { role: updated.role },
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
    const currentUser = c.get('cognitoUser') as CognitoUser | undefined;
    const adminId = currentUser?.sub || 'system';
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

    await recordAuditLog(undefined, {
        entityType: 'user',
        entityId: id || '',
        eventType: 'user.deleted',
        actorType: 'admin',
        actorId: adminId,
        previousState: { deleted: false },
        newState: { deleted: true },
    });

    return sendResponse(c, {
        message: 'User deleted successfully',
    });
}

// ---------------------------------------------------------------------------
// POST /admin/users/:id/ban
// ---------------------------------------------------------------------------
export async function banUserHandler(c: Context) {
    const currentUser = c.get('cognitoUser') as CognitoUser | undefined;
    const adminId = currentUser?.sub || 'system';
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
                data: { status: 'canceled', cancelAtPeriodEnd: false },
            });
        } catch (error) {
            console.error('Failed to cancel Stripe subscription during ban:', error);
        }
    }

    // 2. Disable user in Cognito and global sign out
    try {
        await authService.adminDisableUser(user.email);
        await authService.adminUserGlobalSignOut(user.email);
    } catch (error) {
        console.error('Failed to disable Cognito user during ban:', error);
    }

    // 3. Update DB
    const updatedUser = await db.user.update({
        where: { id },
        data: {
            status: 'BANNED',
            suspendedAt: new Date(),
            suspendedReason: reason || 'Violation of Terms of Service',
        },
    });

    await recordAuditLog(undefined, {
        entityType: 'user',
        entityId: id || '',
        eventType: 'user.banned',
        actorType: 'admin',
        actorId: adminId,
        previousState: { status: user.status },
        newState: { status: 'BANNED', reason },
    });

    return sendResponse(c, {
        data: updatedUser,
        message: 'User has been permanently banned',
    });
}

// ---------------------------------------------------------------------------
// POST /admin/users/:id/payment-lock
// ---------------------------------------------------------------------------
export async function paymentLockUserHandler(c: Context) {
    const currentUser = c.get('cognitoUser') as CognitoUser | undefined;
    const adminId = currentUser?.sub || 'system';
    const { id } = c.req.param();
    const body = await c.req.json();
    const { reason, bookingId } = body as { reason: string; bookingId?: string };

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

    // Update DB to PAYMENT_LOCKED
    const updatedUser = await db.user.update({
        where: { id },
        data: {
            status: 'PAYMENT_LOCKED',
            paymentLockedAt: new Date(),
            paymentLockedReason: reason || 'Failed payment requires resolution',
            overdueBookingId: bookingId || null,
        },
    });

    await recordAuditLog(undefined, {
        entityType: 'user',
        entityId: id || '',
        eventType: 'user.payment_locked',
        actorType: 'admin',
        actorId: adminId,
        previousState: { status: user.status },
        newState: { status: 'PAYMENT_LOCKED', reason, bookingId },
    });

    return sendResponse(c, {
        data: updatedUser,
        message: 'User account has been locked for payment',
    });
}

export async function adminCreateUserHandler(c: Context) {
    const currentUser = c.get('cognitoUser') as CognitoUser | undefined;

    if (!currentUser || currentUser.role.toUpperCase() !== 'ADMIN') {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Only an admin can perform this action',
            code: 'FORBIDDEN',
        });
    }

    const body = c.get('validatedBody') as any;

    // 1. Create in Cognito
    const result = await authService.signUp(
        body.email,
        body.password,
        body.firstName,
        body.lastName,
        body.role
    );

    const userSub = result.userSub;
    const roleUpper = body.role.toUpperCase();

    // 2. Create in DB
    const createdUser = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                id: userSub,
                email: body.email,
                role: roleUpper as any,
                status: 'VERIFIED',
            },
        });

        const fullName = `${body.firstName} ${body.lastName}`.trim();

        if (roleUpper === 'OPERATOR') {
            await tx.operatorProfile.create({
                data: {
                    userId: user.id,
                    vaId: generateVAID('va-op'),
                    fullName,
                    organisation: body.organisation || null,
                    contactPhone: body.contactPhone || '',
                    flyerId: body.flyerId || '',
                    operatorReference: body.operatorId || null,
                },
            });

            // Subscribe operator to default PAYG plan if it exists
            const activePlans = await tx.subscriptionPlan.findMany({ where: { isActive: true } });
            const paygPlan = activePlans.find((p: any) => {
                try {
                    const features = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
                    return features?.billingType === 'payg';
                } catch {
                    return false;
                }
            });
            if (paygPlan) {
                await tx.userSubscription.create({
                    data: {
                        userId: user.id,
                        planId: paygPlan.id,
                        status: 'ACTIVE',
                    },
                });
            }
        } else if (roleUpper === 'ASSETMANAGER') {
            await tx.assetManagerProfile.create({
                data: {
                    userId: user.id,
                    vaId: generateVAID('va-am'),
                    fullName,
                    organisation: body.organisation || null,
                    contactPhone: body.contactPhone || '',
                },
            });
        }

        // Welcome notification
        await tx.notification.create({
            data: {
                userId: user.id,
                type: 'success',
                title: 'Account Created by Admin',
                message: 'Your account was created by platform administrator.',
                actionUrl: '/dashboard',
            },
        });

        return user;
    });

    return sendCreatedResponse(
        c,
        {
            user: {
                id: createdUser.id,
                email: createdUser.email,
                role: createdUser.role.toLowerCase(),
                status: 'active',
            },
            message: 'User created successfully',
        },
        'User created successfully'
    );
}

export async function updateUserStatusHandler(c: Context) {
    const currentUser = c.get('cognitoUser') as CognitoUser | undefined;

    if (!currentUser || currentUser.role.toUpperCase() !== 'ADMIN') {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Only an admin can perform this action',
            code: 'FORBIDDEN',
        });
    }

    const { id } = c.req.param();
    const body = await c.req.json();
    const { status } = body as { status: 'UNVERIFIED' | 'VERIFIED' | 'SUSPENDED' | 'BANNED' | 'PAYMENT_LOCKED' };

    if (!['UNVERIFIED', 'VERIFIED', 'SUSPENDED', 'BANNED', 'PAYMENT_LOCKED'].includes(status)) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Invalid account status specified',
            code: 'INVALID_STATUS',
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

    // Cognito handling: enable or disable depending on state
    try {
        if (status === 'SUSPENDED' || status === 'BANNED') {
            await authService.adminDisableUser(user.email);
            await authService.adminUserGlobalSignOut(user.email);
        } else {
            await authService.adminEnableUser(user.email);
        }
    } catch (error) {
        console.error('Cognito sync error during status update:', error);
    }

    const updatedUser = await db.user.update({
        where: { id },
        data: {
            status,
            ...(status !== 'SUSPENDED' ? {
                suspendedAt: null,
                suspendedReason: null,
                suspendedUntil: null,
            } : {}),
        },
    });

    await recordAuditLog(undefined, {
        entityType: 'user',
        entityId: id || '',
        eventType: 'user.status_updated',
        actorType: 'admin',
        actorId: currentUser?.sub || 'system',
        previousState: { status: user.status },
        newState: { status: updatedUser.status },
    });

    return sendResponse(c, {
        data: {
            id: updatedUser.id,
            status: updatedUser.status,
        },
        message: 'User status updated successfully',
    });
}
