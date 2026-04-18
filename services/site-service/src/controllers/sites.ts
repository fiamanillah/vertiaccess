// services/site-service/src/controllers/sites.ts
import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@serverless-backend-starter/database';
import {
    AppError,
    HTTPStatusCode,
    sendResponse,
    sendCreatedResponse,
    type CognitoUser,
    generateHumanId,
} from '@serverless-backend-starter/core';
import {
    createSiteSchema,
    updateSiteSchema,
    updateSiteStatusSchema,
} from '../schemas/site.schema.ts';
import { generatePresignedDownloadUrl } from '../services/s3.service.ts';

// ==========================================
// Helpers
// ==========================================

function getCognitoUser(c: Context): CognitoUser {
    return c.get('cognitoUser') as CognitoUser;
}

function mapRoleToDbRole(role: string): 'ADMIN' | 'OPERATOR' | 'LANDOWNER' {
    const normalized = (role || '').toUpperCase();
    if (normalized === 'ADMIN') return 'ADMIN';
    if (normalized === 'LANDOWNER') return 'LANDOWNER';
    return 'OPERATOR';
}

async function ensureAuthenticatedUserExists(cognitoUser: CognitoUser): Promise<string> {
    const dbRole = mapRoleToDbRole(cognitoUser.role);

    const userById = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        select: { id: true, email: true, role: true },
    });

    let effectiveUserId = cognitoUser.sub;

    if (userById) {
        effectiveUserId = userById.id;

        if (userById.role !== dbRole) {
            await db.user.update({
                where: { id: userById.id },
                data: { role: dbRole },
            });
        }
    } else {
        const userByEmail = await db.user.findUnique({
            where: { email: cognitoUser.email },
            select: { id: true, role: true },
        });

        if (userByEmail) {
            effectiveUserId = userByEmail.id;

            if (userByEmail.role !== dbRole) {
                await db.user.update({
                    where: { id: userByEmail.id },
                    data: { role: dbRole },
                });
            }
        } else {
            await db.user.create({
                data: {
                    id: cognitoUser.sub,
                    email: cognitoUser.email,
                    role: dbRole,
                },
            });
        }
    }

    if (dbRole === 'LANDOWNER') {
        const fullName = `${cognitoUser.firstName || ''} ${cognitoUser.lastName || ''}`.trim();
        await db.landownerProfile.upsert({
            where: { userId: effectiveUserId },
            create: {
                userId: effectiveUserId,
                fullName: fullName || cognitoUser.email,
                contactPhone:
                    (cognitoUser as any).phone_number || (cognitoUser as any).phoneNumber || '',
            },
            update: {},
        });
    }

    return effectiveUserId;
}

function requireOwnerOrAdmin(
    cognitoUser: CognitoUser,
    landownerId: string,
    effectiveUserId: string
): void {
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
    if (!isAdmin && cognitoUser.sub !== landownerId && effectiveUserId !== landownerId) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'You do not have permission to access this site',
            code: 'FORBIDDEN',
        });
    }
}

/**
 * Serialize a Prisma Site record into a clean API response.
 * Converts Decimal fields to numbers and parses JSON geometry metadata.
 */
function serializeSite(site: any) {
    const geometryMeta = site.geometryMetadata || {};

    return {
        id: site.id,
        humanId: site.humanId || null,
        landownerId: site.landownerId,
        siteReference: site.siteReference,
        name: site.name,
        description: site.description,
        siteType: site.siteType,
        siteCategory: site.siteCategory,
        address: site.address,
        postcode: site.postcode,
        contactEmail: site.contactEmail,
        contactPhone: site.contactPhone,
        validityStart: site.validityStart?.toISOString?.() || site.validityStart,
        validityEnd: site.validityEnd?.toISOString?.() || site.validityEnd || null,
        autoApprove: site.autoApprove,
        exclusiveUse: site.exclusiveUse,
        emergencyRecoveryEnabled: site.emergencyRecoveryEnabled,
        clzEnabled: site.clzEnabled,
        geometry: geometryMeta.geometry || null,
        clzGeometry: geometryMeta.clzGeometry || null,
        toalAccessFee: site.toalAccessFee ? Number(site.toalAccessFee.toString()) : null,
        clzAccessFee: site.clzAccessFee ? Number(site.clzAccessFee.toString()) : null,
        hourlyRate: site.hourlyRate ? Number(site.hourlyRate.toString()) : null,
        cancellationFeePercentage: site.cancellationFeePercentage
            ? Number(site.cancellationFeePercentage.toString())
            : null,
        currency: site.currency,
        status: site.status,
        siteInformation: geometryMeta.siteInformation || null,
        photoUrl: geometryMeta.photoUrl || null,
        documents: (site.documents || []).map((doc: any) => ({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileKey: doc.fileKey,
            fileSize: doc.fileSize,
            uploadedAt: doc.uploadedAt?.toISOString?.() || doc.uploadedAt,
        })),
        createdAt: site.createdAt?.toISOString?.() || site.createdAt,
    };
}

// ==========================================
// Handlers
// ==========================================

/**
 * POST /sites/v1 — Create a new site
 */
export async function createSiteHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const body = (c.req as any).valid('json') as z.infer<typeof createSiteSchema>;

    // Safety net for legacy users that exist in Cognito but not yet in local DB.
    const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser);

    const userRecord = await db.user.findUnique({
        where: { id: effectiveUserId },
        select: { role: true, status: true },
    });

    if (!userRecord) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'User not found',
            code: 'NOT_FOUND',
        });
    }

    if (userRecord.role === 'LANDOWNER' && userRecord.status !== 'VERIFIED') {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Landowner profile must be verified before creating a site',
            code: 'FORBIDDEN',
        });
    }

    // Build geometry metadata JSON (stores circle/polygon data without PostGIS)
    const geometryMetadata: Record<string, unknown> = {
        geometry: body.geometry,
        clzGeometry: body.clzGeometry || null,
        siteInformation: body.siteInformation || null,
        photoUrl: null,
        ...body.geometryMetadata,
    };

    const site: any = await db.site.create({
        data: {
            landownerId: effectiveUserId,
            humanId: generateHumanId(),
            name: body.name,
            description: body.description || null,
            siteType: body.siteType || null,
            siteCategory: body.siteCategory || null,
            address: body.address,
            postcode: body.postcode,
            contactEmail: body.contactEmail,
            contactPhone: body.contactPhone,
            geometryType: body.geometry.type.toUpperCase() as any,
            validityStart: new Date(body.validityStart),
            validityEnd: body.validityEnd ? new Date(body.validityEnd) : null,
            autoApprove: body.autoApprove ?? false,
            exclusiveUse: body.exclusiveUse ?? false,
            emergencyRecoveryEnabled: body.emergencyRecoveryEnabled ?? false,
            clzEnabled: body.clzEnabled ?? false,
            toalAccessFee: body.toalAccessFee ?? null,
            clzAccessFee: body.clzAccessFee ?? null,
            hourlyRate: body.hourlyRate ?? null,
            cancellationFeePercentage: body.cancellationFeePercentage ?? null,
            geometryMetadata: geometryMetadata as any,
            status: 'UNDER_REVIEW',
            // Create document records inline
            documents:
                body.documents && body.documents.length > 0
                    ? {
                          create: body.documents.map(doc => ({
                              fileKey: doc.fileKey,
                              fileName: doc.fileName || null,
                              fileSize: doc.fileSize || null,
                              documentType: doc.documentType || null,
                          })),
                      }
                    : undefined,
        },
        include: { documents: true },
    });

    // If any photo document, use the first one as photoUrl
    const photoDoc = (site.documents || []).find((d: any) => d.documentType === 'photo');
    if (photoDoc) {
        const photoUrl = await generatePresignedDownloadUrl(photoDoc.fileKey);
        geometryMetadata.photoUrl = photoUrl;
        await db.site.update({
            where: { id: site.id },
            data: { geometryMetadata: geometryMetadata as any },
        });
    }

    await db.notification.create({
        data: {
            userId: effectiveUserId,
            type: 'info',
            title: 'Site Submitted for Review',
            message: `Your site "${site.name}" has been submitted and is pending admin review.`,
            actionUrl: '/dashboard/landowner',
            relatedEntityId: site.id,
        },
    });

    return sendCreatedResponse(c, serializeSite(site), 'Site created successfully');
}

/**
 * GET /sites/v1 — List sites for the authenticated user
 */
export async function listSitesHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
    const effectiveUserId = isAdmin
        ? cognitoUser.sub
        : await ensureAuthenticatedUserExists(cognitoUser);

    const sites = await db.site.findMany({
        where: {
            ...(isAdmin ? {} : { landownerId: effectiveUserId }),
            deletedAt: null,
        },
        include: { documents: true },
        orderBy: { createdAt: 'desc' },
    });

    // Generate signed URLs for photo documents
    const serialized = await Promise.all(
        sites.map(async (site: any) => {
            const s = serializeSite(site);
            // Generate signed URLs for document download
            if (s.documents && s.documents.length > 0) {
                s.documents = await Promise.all(
                    s.documents.map(async (doc: any) => ({
                        ...doc,
                        downloadUrl: await generatePresignedDownloadUrl(doc.fileKey),
                    }))
                );
            }
            return s;
        })
    );

    return sendResponse(c, {
        message: 'Sites fetched',
        data: serialized,
    });
}

/**
 * GET /sites/v1/:siteId — Get a single site by ID
 */
export async function getSiteHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser);
    const siteId = c.req.param('siteId');

    const site = await db.site.findUnique({
        where: { id: siteId },
        include: { documents: true },
    });

    if (!site || site.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Site not found',
            code: 'NOT_FOUND',
        });
    }

    requireOwnerOrAdmin(cognitoUser, site.landownerId, effectiveUserId);

    const serialized = serializeSite(site);
    // Generate signed download URLs for documents
    if (serialized.documents && serialized.documents.length > 0) {
        serialized.documents = await Promise.all(
            serialized.documents.map(async (doc: any) => ({
                ...doc,
                downloadUrl: await generatePresignedDownloadUrl(doc.fileKey),
            }))
        );
    }

    return sendResponse(c, {
        message: 'Site fetched',
        data: serialized,
    });
}

/**
 * PATCH /sites/v1/:siteId — Update site details
 */
export async function updateSiteHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser);
    const siteId = c.req.param('siteId');
    const body = (c.req as any).valid('json') as z.infer<typeof updateSiteSchema>;

    const existing = await db.site.findUnique({ where: { id: siteId } });
    if (!existing || existing.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Site not found',
            code: 'NOT_FOUND',
        });
    }

    requireOwnerOrAdmin(cognitoUser, existing.landownerId, effectiveUserId);

    // Merge geometry metadata
    const existingMeta = (existing.geometryMetadata as Record<string, unknown>) || {};
    const updatedMeta: Record<string, unknown> = { ...existingMeta };
    if (body.geometry) updatedMeta.geometry = body.geometry;
    if (body.clzGeometry) updatedMeta.clzGeometry = body.clzGeometry;
    if (body.geometryMetadata) Object.assign(updatedMeta, body.geometryMetadata);
    if (body.siteInformation !== undefined) updatedMeta.siteInformation = body.siteInformation;

    const site = await db.site.update({
        where: { id: siteId },
        data: {
            ...(body.name !== undefined && { name: body.name }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.address !== undefined && { address: body.address }),
            ...(body.postcode !== undefined && { postcode: body.postcode }),
            ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
            ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
            ...(body.validityStart !== undefined && {
                validityStart: new Date(body.validityStart),
            }),
            ...(body.validityEnd !== undefined && {
                validityEnd: body.validityEnd ? new Date(body.validityEnd) : null,
            }),
            ...(body.autoApprove !== undefined && { autoApprove: body.autoApprove }),
            ...(body.exclusiveUse !== undefined && { exclusiveUse: body.exclusiveUse }),
            ...(body.emergencyRecoveryEnabled !== undefined && {
                emergencyRecoveryEnabled: body.emergencyRecoveryEnabled,
            }),
            ...(body.clzEnabled !== undefined && { clzEnabled: body.clzEnabled }),
            ...(body.toalAccessFee !== undefined && { toalAccessFee: body.toalAccessFee }),
            ...(body.clzAccessFee !== undefined && { clzAccessFee: body.clzAccessFee }),
            ...(body.hourlyRate !== undefined && { hourlyRate: body.hourlyRate }),
            ...(body.cancellationFeePercentage !== undefined && {
                cancellationFeePercentage: body.cancellationFeePercentage,
            }),
            geometryMetadata: updatedMeta as any,
        },
        include: { documents: true },
    });

    return sendResponse(c, {
        message: 'Site updated',
        data: serializeSite(site),
    });
}

/**
 * PATCH /sites/v1/:siteId/status — Update site status
 */
export async function updateSiteStatusHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser);
    const siteId = c.req.param('siteId');
    const body = (c.req as any).valid('json') as z.infer<typeof updateSiteStatusSchema>;

    const existing = await db.site.findUnique({ where: { id: siteId } });
    if (!existing || existing.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Site not found',
            code: 'NOT_FOUND',
        });
    }

    requireOwnerOrAdmin(cognitoUser, existing.landownerId, effectiveUserId);

    // Admin can set any status; landowner can only disable/restrict/withdraw their own sites
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
    const allowedLandownerStatuses = ['DISABLE', 'TEMPORARY_RESTRICTED', 'WITHDRAWN', 'ACTIVE'];

    if (!isAdmin && !allowedLandownerStatuses.includes(body.status)) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: `Landowners cannot set status to ${body.status}`,
            code: 'FORBIDDEN',
        });
    }

    // Landowner can only re-activate their own DISABLE/TEMPORARY_RESTRICTED sites
    if (
        !isAdmin &&
        body.status === 'ACTIVE' &&
        !['DISABLE', 'TEMPORARY_RESTRICTED'].includes(existing.status)
    ) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Cannot re-activate a site from the current status',
            code: 'FORBIDDEN',
        });
    }

    const site = await db.site.update({
        where: { id: siteId },
        data: { status: body.status as any },
        include: { documents: true },
    });

    const statusNotificationMap: Record<
        string,
        { type: 'success' | 'warning' | 'info' | 'error'; title: string; message: string }
    > = {
        ACTIVE: {
            type: 'success',
            title: 'Site Activated',
            message: `Your site "${site.name}" is now active and visible to operators.`,
        },
        REJECTED: {
            type: 'error',
            title: 'Site Rejected',
            message: `Your site "${site.name}" was rejected. Please review and update your submission.`,
        },
        DISABLE: {
            type: 'warning',
            title: 'Site Disabled',
            message: `Your site "${site.name}" has been disabled and is no longer bookable.`,
        },
        TEMPORARY_RESTRICTED: {
            type: 'warning',
            title: 'Site Temporarily Restricted',
            message: `Your site "${site.name}" is temporarily restricted.`,
        },
        WITHDRAWN: {
            type: 'info',
            title: 'Site Withdrawn',
            message: `Your site "${site.name}" has been withdrawn.`,
        },
        UNDER_REVIEW: {
            type: 'info',
            title: 'Site Under Review',
            message: `Your site "${site.name}" is currently under review.`,
        },
    };

    const notificationMeta = statusNotificationMap[body.status];
    if (notificationMeta) {
        await db.notification.create({
            data: {
                userId: site.landownerId,
                type: notificationMeta.type,
                title: notificationMeta.title,
                message: notificationMeta.message,
                actionUrl: `/dashboard/landowner`,
                relatedEntityId: site.id,
            },
        });
    }

    return sendResponse(c, {
        message: `Site status updated to ${body.status}`,
        data: serializeSite(site),
    });
}

/**
 * DELETE /sites/v1/:siteId — Soft delete a site
 */
export async function deleteSiteHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser);
    const siteId = c.req.param('siteId');

    const existing = await db.site.findUnique({ where: { id: siteId } });
    if (!existing || existing.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Site not found',
            code: 'NOT_FOUND',
        });
    }

    requireOwnerOrAdmin(cognitoUser, existing.landownerId, effectiveUserId);

    await db.site.update({
        where: { id: siteId },
        data: { deletedAt: new Date() },
    });

    return sendResponse(c, { message: 'Site deleted' });
}

/**
 * GET /sites/v1/public — Public listing of active sites (for discovery map)
 */
export async function listPublicSitesHandler(c: Context): Promise<Response> {
    const sites = await db.site.findMany({
        where: {
            status: 'ACTIVE',
            deletedAt: null,
        },
        include: { documents: true },
        orderBy: { createdAt: 'desc' },
    });

    const serialized = sites.map((site: any) => serializeSite(site));

    return sendResponse(c, {
        message: 'Public sites fetched',
        data: serialized,
    });
}
