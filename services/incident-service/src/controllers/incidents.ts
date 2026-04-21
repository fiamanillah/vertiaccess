import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@serverless-backend-starter/database';
import {
    AppError,
    HTTPStatusCode,
    sendCreatedResponse,
    sendResponse,
    type CognitoUser,
} from '@serverless-backend-starter/core';
import {
    createIncidentDocumentSchema,
    createIncidentMessageSchema,
    createIncidentSchema,
    updateIncidentStatusSchema,
} from '../schemas/incident.schema.ts';

type IncidentRecord = NonNullable<Awaited<ReturnType<typeof loadIncidentById>>>;

function getCognitoUser(c: Context): CognitoUser {
    return c.get('cognitoUser') as CognitoUser;
}

function mapRoleToDbRole(role: string): 'ADMIN' | 'OPERATOR' | 'LANDOWNER' {
    const normalized = (role || '').toUpperCase();

    if (normalized === 'ADMIN') return 'ADMIN';
    if (normalized === 'LANDOWNER') return 'LANDOWNER';
    return 'OPERATOR';
}

function isAdminUser(cognitoUser: CognitoUser): boolean {
    return (cognitoUser.role || '').toLowerCase() === 'admin';
}

function resolveUserDisplayName(user: any): string {
    if (!user) return 'Unknown';

    const profile = user.operatorProfile || user.landownerProfile;
    return profile?.fullName || user.fullName || user.email || 'Unknown';
}

function resolveUserRole(user: any): 'admin' | 'operator' | 'landowner' {
    const normalized = (user?.role || '').toLowerCase();
    if (normalized === 'admin') return 'admin';
    if (normalized === 'landowner') return 'landowner';
    return 'operator';
}

function extractDocumentName(fileKey: string): string {
    const rawName = fileKey.split('/').pop() || fileKey;
    return decodeURIComponent(rawName.split('::')[0] || rawName);
}

function extractDocumentSize(fileKey: string): string {
    const sizePart = fileKey.split('::')[1];
    return sizePart ? decodeURIComponent(sizePart) : 'Unknown';
}

function buildDocumentFileKey(incidentId: string, fileName: string, fileSize?: string): string {
    const safeName = encodeURIComponent(fileName.trim().replace(/\s+/g, '-'));
    const sizePart = encodeURIComponent(fileSize || 'Unknown');
    return `${incidentId}/${safeName}::${sizePart}`;
}

function serializeIncidentMessage(message: any) {
    return {
        id: message.id,
        role: resolveUserRole(message.sender),
        sender: resolveUserDisplayName(message.sender),
        text: message.messageText,
        timestamp: message.createdAt?.toISOString?.() || message.createdAt,
    };
}

function serializeIncidentDocument(document: any) {
    return {
        id: document.id,
        name: document.fileName || extractDocumentName(document.fileKey),
        type: document.documentType || 'FILE',
        size: document.fileSize || extractDocumentSize(document.fileKey),
        uploadedAt: document.uploadedAt?.toISOString?.() || document.uploadedAt,
        uploadedBy: resolveUserDisplayName(document.uploader),
    };
}

function serializeIncident(incident: any) {
    const siteLandowner = incident.site?.landowner || null;
    const reporter = incident.reporter || null;
    const bookingOperator = incident.booking?.operator || null;
    const reporterRole = resolveUserRole(reporter);
    const reporterName = resolveUserDisplayName(reporter);
    const messages = (incident.messages || []).map(serializeIncidentMessage);

    return {
        id: incident.id,
        landownerId: incident.site?.landownerId || null,
        landownerName: resolveUserDisplayName(siteLandowner),
        siteId: incident.siteId,
        siteName: incident.site?.name || '',
        bookingId: incident.bookingId || undefined,
        operatorId: incident.booking?.operatorId || null,
        operatorName:
            resolveUserDisplayName(bookingOperator) ||
            (reporterRole === 'operator' ? reporterName : undefined),
        type: incident.incidentType,
        description: incident.description,
        urgency: incident.urgency,
        estimatedDamage: incident.estimatedDamage
            ? Number(incident.estimatedDamage.toString())
            : undefined,
        status: incident.status,
        adminNotes: incident.adminNotes || undefined,
        messages:
            messages.length > 0
                ? messages
                : [
                      {
                          id: `${incident.id}-message-0`,
                          role: reporterRole,
                          sender: reporterName,
                          text: incident.description,
                          timestamp: incident.createdAt?.toISOString?.() || incident.createdAt,
                      },
                  ],
        relatedDocumentation: (incident.documents || []).map(serializeIncidentDocument),
        createdAt: incident.createdAt?.toISOString?.() || incident.createdAt,
        resolvedAt: incident.resolvedAt?.toISOString?.() || incident.resolvedAt || undefined,
        incidentDateTime:
            incident.incidentDateTime?.toISOString?.() || incident.incidentDateTime || undefined,
        insuranceNotified: incident.insuranceNotified,
        immediateActionTaken: incident.immediateActionTaken || undefined,
        reporterId: incident.reporterId,
    };
}

const incidentInclude = {
    site: {
        include: {
            landowner: {
                include: {
                    operatorProfile: true,
                    landownerProfile: true,
                },
            },
        },
    },
    reporter: {
        include: {
            operatorProfile: true,
            landownerProfile: true,
        },
    },
    booking: {
        include: {
            operator: {
                include: {
                    operatorProfile: true,
                    landownerProfile: true,
                },
            },
        },
    },
    documents: {
        include: {
            uploader: {
                include: {
                    operatorProfile: true,
                    landownerProfile: true,
                },
            },
        },
        orderBy: { uploadedAt: 'asc' },
    },
    messages: {
        include: {
            sender: {
                include: {
                    operatorProfile: true,
                    landownerProfile: true,
                },
            },
        },
        orderBy: { createdAt: 'asc' },
    },
} as const;

function incidentBookingInclude() {
    return {
        site: {
            include: {
                landowner: {
                    include: {
                        operatorProfile: true,
                        landownerProfile: true,
                    },
                },
            },
        },
        operator: {
            include: {
                operatorProfile: true,
                landownerProfile: true,
            },
        },
    } as const;
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

    if (dbRole === 'OPERATOR') {
        const fullName = `${cognitoUser.firstName || ''} ${cognitoUser.lastName || ''}`.trim();
        await db.operatorProfile.upsert({
            where: { userId: effectiveUserId },
            create: {
                userId: effectiveUserId,
                fullName: fullName || cognitoUser.email,
                contactPhone:
                    (cognitoUser as any).phone_number || (cognitoUser as any).phoneNumber || '',
                flyerId:
                    (cognitoUser as any).flyerId || `${effectiveUserId.slice(0, 8).toUpperCase()}`,
            },
            update: {},
        });
    }

    return effectiveUserId;
}

async function loadIncidentById(incidentId: string) {
    return db.incident.findUnique({
        where: { id: incidentId },
        include: incidentInclude,
    });
}

async function assertIncidentAccess(incident: IncidentRecord | null, cognitoUser: CognitoUser) {
    if (!incident) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Incident not found',
            code: 'NOT_FOUND',
        });
    }

    if (isAdminUser(cognitoUser)) {
        return;
    }

    const isReporter = incident.reporterId === cognitoUser.sub;
    const isSiteOwner = incident.site?.landownerId === cognitoUser.sub;

    if (!isReporter && !isSiteOwner) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'You do not have permission to access this incident',
            code: 'FORBIDDEN',
        });
    }
}

async function resolveNotificationRecipients(incident: any, senderId: string) {
    const recipientIds = new Set<string>();
    recipientIds.add(incident.reporterId);

    if (incident.site?.landownerId) {
        recipientIds.add(incident.site.landownerId);
    }

    if (incident.booking?.operatorId) {
        recipientIds.add(incident.booking.operatorId);
    }

    const adminUsers = await db.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, role: true },
    });

    adminUsers.forEach(admin => recipientIds.add(admin.id));

    recipientIds.delete(senderId);

    return db.user.findMany({
        where: { id: { in: [...recipientIds] } },
        select: { id: true, role: true },
    });
}

async function createIncidentNotifications(
    incident: any,
    senderId: string,
    title: string,
    message: string
) {
    const recipients = await resolveNotificationRecipients(incident, senderId);

    await Promise.all(
        recipients.map(recipient =>
            db.notification.create({
                data: {
                    userId: recipient.id,
                    type: recipient.role === 'ADMIN' ? 'warning' : 'info',
                    title,
                    message,
                    actionUrl:
                        recipient.role === 'ADMIN'
                            ? '/dashboard/admin'
                            : recipient.role === 'LANDOWNER'
                              ? '/dashboard/landowner'
                              : '/dashboard/operator',
                    relatedEntityId: incident.id,
                },
            })
        )
    );
}

function resolveIncidentScopeWhere(cognitoUser: CognitoUser) {
    if (isAdminUser(cognitoUser)) {
        return {};
    }

    const role = (cognitoUser.role || '').toLowerCase();

    if (role === 'landowner') {
        return {
            site: {
                landownerId: cognitoUser.sub,
            },
        };
    }

    return {
        reporterId: cognitoUser.sub,
    };
}

export async function listIncidentsHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);

    await ensureAuthenticatedUserExists(cognitoUser);

    const incidents = await db.incident.findMany({
        where: resolveIncidentScopeWhere(cognitoUser),
        include: incidentInclude,
        orderBy: { createdAt: 'desc' },
    });

    return sendResponse(c, {
        message: 'Incidents retrieved successfully',
        data: incidents.map(serializeIncident),
    });
}

export async function listMyIncidentsHandler(c: Context): Promise<Response> {
    return listIncidentsHandler(c);
}

export async function getIncidentHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const incidentId = c.req.param('incidentId');

    await ensureAuthenticatedUserExists(cognitoUser);

    const incident = await loadIncidentById(incidentId);
    await assertIncidentAccess(incident, cognitoUser);

    return sendResponse(c, {
        message: 'Incident retrieved successfully',
        data: serializeIncident(incident),
    });
}

export async function listSiteIncidentsHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const siteId = c.req.param('siteId');

    await ensureAuthenticatedUserExists(cognitoUser);

    const site = await db.site.findUnique({
        where: { id: siteId },
        select: { id: true, landownerId: true },
    });

    if (!site) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Site not found',
            code: 'NOT_FOUND',
        });
    }

    if (!isAdminUser(cognitoUser) && site.landownerId !== cognitoUser.sub) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'You do not have permission to access this site',
            code: 'FORBIDDEN',
        });
    }

    const incidents = await db.incident.findMany({
        where: { siteId },
        include: incidentInclude,
        orderBy: { createdAt: 'desc' },
    });

    return sendResponse(c, {
        message: 'Site incidents retrieved successfully',
        data: incidents.map(serializeIncident),
    });
}

export async function createIncidentHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const body = c.req.valid('json' as never) as z.infer<typeof createIncidentSchema>;

    const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser);
    const user = await db.user.findUnique({
        where: { id: effectiveUserId },
        include: {
            operatorProfile: true,
            landownerProfile: true,
        },
    });

    if (!user) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'User not found',
            code: 'NOT_FOUND',
        });
    }

    const site = await db.site.findUnique({
        where: { id: body.siteId },
        include: {
            landowner: {
                include: {
                    operatorProfile: true,
                    landownerProfile: true,
                },
            },
        },
    });

    if (!site || site.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Site not found',
            code: 'NOT_FOUND',
        });
    }

    const role = (cognitoUser.role || '').toLowerCase();
    let booking = null as any;

    if (body.bookingId) {
        const bookingIdentifier = body.bookingId.trim();

        booking = await db.booking.findUnique({
            where: { id: bookingIdentifier },
            include: incidentBookingInclude(),
        });

        if (!booking) {
            booking = await db.booking.findFirst({
                where: {
                    OR: [
                        { operationReference: bookingIdentifier },
                        { bookingReference: bookingIdentifier },
                        { humanId: bookingIdentifier },
                    ],
                },
                include: incidentBookingInclude(),
            });
        }

        if (!booking) {
            throw new AppError({
                statusCode: HTTPStatusCode.BAD_REQUEST,
                message: 'Booking not found',
                code: 'BAD_REQUEST',
            });
        }

        if (booking.siteId !== site.id) {
            throw new AppError({
                statusCode: HTTPStatusCode.BAD_REQUEST,
                message: 'Booking does not belong to the selected site',
                code: 'BAD_REQUEST',
            });
        }

        if (!isAdminUser(cognitoUser)) {
            if (role === 'operator' && booking.operatorId !== effectiveUserId) {
                throw new AppError({
                    statusCode: HTTPStatusCode.FORBIDDEN,
                    message: 'You can only report incidents for your own bookings',
                    code: 'FORBIDDEN',
                });
            }

            if (role === 'landowner' && booking.site?.landownerId !== effectiveUserId) {
                throw new AppError({
                    statusCode: HTTPStatusCode.FORBIDDEN,
                    message: 'You can only report incidents on your own site',
                    code: 'FORBIDDEN',
                });
            }
        }
    } else if (
        !isAdminUser(cognitoUser) &&
        role === 'landowner' &&
        site.landownerId !== effectiveUserId
    ) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'You can only report incidents on your own site',
            code: 'FORBIDDEN',
        });
    } else if (!isAdminUser(cognitoUser) && role === 'operator') {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Operators must link an incident to a booking',
            code: 'BAD_REQUEST',
        });
    }

    const incident = await db.incident.create({
        data: {
            bookingId: booking?.id || null,
            siteId: site.id,
            reporterId: effectiveUserId,
            incidentType: body.type,
            urgency: body.urgency,
            description: body.description,
            incidentDateTime: body.incidentDateTime ? new Date(body.incidentDateTime) : null,
            estimatedDamage: body.estimatedDamage ?? null,
            immediateActionTaken: body.immediateActionTaken ?? null,
            insuranceNotified: body.insuranceNotified ?? false,
            status: body.status || (role === 'operator' ? 'UNDER_REVIEW' : 'OPEN'),
        },
        include: incidentInclude,
    });

    const createdIncident = await loadIncidentById(incident.id);

    if (!createdIncident) {
        throw new AppError({
            statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
            message: 'Failed to load created incident',
            code: 'INTERNAL_SERVER_ERROR',
        });
    }

    await createIncidentNotifications(
        createdIncident,
        effectiveUserId,
        'New Incident Report',
        `A new incident report for "${site.name}" has been submitted.`
    );

    return sendCreatedResponse(c, serializeIncident(createdIncident), 'Incident report created');
}

export async function updateIncidentStatusHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);

    if (!isAdminUser(cognitoUser)) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Only administrators can update incident status',
            code: 'FORBIDDEN',
        });
    }

    const incidentId = c.req.param('incidentId');
    const body = c.req.valid('json' as never) as z.infer<typeof updateIncidentStatusSchema>;

    const incident = await loadIncidentById(incidentId);

    if (!incident) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Incident not found',
            code: 'NOT_FOUND',
        });
    }

    const resolvedAt = body.status === 'RESOLVED' || body.status === 'CLOSED' ? new Date() : null;

    await db.incident.update({
        where: { id: incidentId },
        data: {
            status: body.status,
            adminNotes: body.adminNotes ?? incident.adminNotes,
            resolvedAt,
        },
    });

    const updatedIncident = await loadIncidentById(incidentId);

    if (!updatedIncident) {
        throw new AppError({
            statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
            message: 'Failed to load updated incident',
            code: 'INTERNAL_SERVER_ERROR',
        });
    }

    await createIncidentNotifications(
        updatedIncident,
        cognitoUser.sub,
        `Incident ${body.status.toLowerCase()}`,
        `Incident ${updatedIncident.id} is now marked as ${body.status.replace(/_/g, ' ').toLowerCase()}.`
    );

    return sendResponse(c, {
        message: 'Incident status updated successfully',
        data: serializeIncident(updatedIncident),
    });
}

export async function addIncidentMessageHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const incidentId = c.req.param('incidentId');
    const body = c.req.valid('json' as never) as z.infer<typeof createIncidentMessageSchema>;

    const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser);
    const incident = await loadIncidentById(incidentId);
    await assertIncidentAccess(incident, cognitoUser);

    await db.incidentMessage.create({
        data: {
            incidentId,
            senderId: effectiveUserId,
            messageText: body.messageText,
        },
    });

    const updatedIncident = await loadIncidentById(incidentId);

    if (!updatedIncident) {
        throw new AppError({
            statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
            message: 'Failed to load updated incident',
            code: 'INTERNAL_SERVER_ERROR',
        });
    }

    await createIncidentNotifications(
        updatedIncident,
        effectiveUserId,
        'Incident Message Added',
        `A new message has been added to incident ${updatedIncident.id}.`
    );

    return sendCreatedResponse(c, serializeIncident(updatedIncident), 'Incident message added');
}

export async function addIncidentDocumentHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const incidentId = c.req.param('incidentId');
    const body = c.req.valid('json' as never) as z.infer<typeof createIncidentDocumentSchema>;

    const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser);
    const incident = await loadIncidentById(incidentId);
    await assertIncidentAccess(incident, cognitoUser);

    await db.incidentDocument.create({
        data: {
            incidentId,
            fileKey: body.fileKey || buildDocumentFileKey(incidentId, body.fileName, body.fileSize),
            documentType: body.documentType,
            uploadedBy: effectiveUserId,
        },
    });

    const updatedIncident = await loadIncidentById(incidentId);

    if (!updatedIncident) {
        throw new AppError({
            statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
            message: 'Failed to load updated incident',
            code: 'INTERNAL_SERVER_ERROR',
        });
    }

    await createIncidentNotifications(
        updatedIncident,
        effectiveUserId,
        'Incident Document Added',
        `A document has been attached to incident ${updatedIncident.id}.`
    );

    return sendCreatedResponse(c, serializeIncident(updatedIncident), 'Incident document added');
}
