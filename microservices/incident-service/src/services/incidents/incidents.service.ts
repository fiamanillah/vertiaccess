// microservices/incident-service/src/services/incidents/incidents.service.ts
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    generateVAID,
    type CognitoUser,
} from '@vertiaccess/core';

// ==========================================
// Helpers (Internal to Service)
// ==========================================

function mapRoleToDbRole(role: string): 'ADMIN' | 'OPERATOR' | 'LANDOWNER' {
    const normalized = (role || '').toUpperCase();
    if (normalized === 'ADMIN') return 'ADMIN';
    if (normalized === 'LANDOWNER') return 'LANDOWNER';
    return 'OPERATOR';
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

export function serializeIncidentMessage(message: any) {
    return {
        id: message.id,
        role: resolveUserRole(message.sender),
        sender: resolveUserDisplayName(message.sender),
        text: message.messageText,
        timestamp: message.createdAt?.toISOString?.() || message.createdAt,
    };
}

export function serializeIncidentDocument(document: any) {
    return {
        id: document.id,
        name: document.fileName || extractDocumentName(document.fileKey),
        type: document.documentType || 'FILE',
        size: document.fileSize || extractDocumentSize(document.fileKey),
        uploadedAt: document.uploadedAt?.toISOString?.() || document.uploadedAt,
        uploadedBy: resolveUserDisplayName(document.uploader),
    };
}

export function serializeIncident(incident: any) {
    const siteLandowner = incident.site?.landowner || null;
    const reporter = incident.reporter || null;
    const bookingOperator = incident.booking?.operator || null;
    const reporterRole = resolveUserRole(reporter);
    const reporterName = resolveUserDisplayName(reporter);
    const messages = (incident.messages || []).map(serializeIncidentMessage);

    return {
        id: incident.id,
        vaId: incident.vaId || null,
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

export class IncidentsService {
    static async ensureAuthenticatedUserExists(cognitoUser: CognitoUser): Promise<string> {
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
                    vaId: generateVAID('va-lo'),
                    fullName: fullName || cognitoUser.email,
                    contactPhone: (cognitoUser as any).phone_number || (cognitoUser as any).phoneNumber || '',
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
                    vaId: generateVAID('va-op'),
                    fullName: fullName || cognitoUser.email,
                    contactPhone: (cognitoUser as any).phone_number || (cognitoUser as any).phoneNumber || '',
                    flyerId: (cognitoUser as any).flyerId || `${effectiveUserId.slice(0, 8).toUpperCase()}`,
                },
                update: {},
            });
        }

        return effectiveUserId;
    }

    static async loadIncidentById(incidentId: string) {
        return db.incident.findUnique({
            where: { id: incidentId },
            include: incidentInclude,
        });
    }

    static async assertIncidentAccess(incident: any, cognitoUser: CognitoUser) {
        if (!incident) {
            throw new AppError({
                statusCode: HTTPStatusCode.NOT_FOUND,
                message: 'Incident not found',
                code: 'NOT_FOUND',
            });
        }

        const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
        if (isAdmin) return;

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

    static async resolveNotificationRecipients(incident: any, senderId: string) {
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

    static async createIncidentNotifications(incident: any, senderId: string, title: string, message: string) {
        const recipients = await this.resolveNotificationRecipients(incident, senderId);

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

    static async listIncidents(cognitoUser: CognitoUser) {
        const effectiveUserId = await this.ensureAuthenticatedUserExists(cognitoUser);
        const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
        const role = (cognitoUser.role || '').toLowerCase();

        let where = {};
        if (!isAdmin) {
            if (role === 'landowner') {
                where = { site: { landownerId: cognitoUser.sub } };
            } else {
                where = { reporterId: cognitoUser.sub };
            }
        }

        const incidents = await db.incident.findMany({
            where,
            include: incidentInclude,
            orderBy: { createdAt: 'desc' },
        });

        return incidents.map(serializeIncident);
    }

    static async getIncident(cognitoUser: CognitoUser, incidentId: string) {
        await this.ensureAuthenticatedUserExists(cognitoUser);
        const incident = await this.loadIncidentById(incidentId);
        await this.assertIncidentAccess(incident, cognitoUser);
        return serializeIncident(incident);
    }

    static async createIncident(cognitoUser: CognitoUser, body: any) {
        const effectiveUserId = await this.ensureAuthenticatedUserExists(cognitoUser);
        const role = (cognitoUser.role || '').toLowerCase();
        const isAdmin = role === 'admin';

        const site = await db.site.findUnique({
            where: { id: body.siteId },
        });

        if (!site || site.deletedAt) {
            throw new AppError({
                statusCode: HTTPStatusCode.NOT_FOUND,
                message: 'Site not found',
                code: 'NOT_FOUND',
            });
        }

        let booking = null as any;
        if (body.bookingId) {
            const bookingIdentifier = body.bookingId.trim();
            booking = await db.booking.findFirst({
                where: {
                    OR: [
                        { id: bookingIdentifier },
                        { operationReference: bookingIdentifier },
                        { bookingReference: bookingIdentifier },
                        { vaId: bookingIdentifier },
                    ],
                },
            });

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

            if (!isAdmin) {
                if (role === 'operator' && booking.operatorId !== effectiveUserId) {
                    throw new AppError({
                        statusCode: HTTPStatusCode.FORBIDDEN,
                        message: 'You can only report incidents for your own bookings',
                        code: 'FORBIDDEN',
                    });
                }
                if (role === 'landowner' && site.landownerId !== effectiveUserId) {
                    throw new AppError({
                        statusCode: HTTPStatusCode.FORBIDDEN,
                        message: 'You can only report incidents on your own site',
                        code: 'FORBIDDEN',
                    });
                }
            }
        } else if (!isAdmin && role === 'landowner' && site.landownerId !== effectiveUserId) {
            throw new AppError({
                statusCode: HTTPStatusCode.FORBIDDEN,
                message: 'You can only report incidents on your own site',
                code: 'FORBIDDEN',
            });
        } else if (!isAdmin && role === 'operator') {
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
                vaId: generateVAID('va-inc'),
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

        await this.createIncidentNotifications(
            incident,
            effectiveUserId,
            'New Incident Report',
            `A new incident report for "${site.name}" has been submitted.`
        );

        return serializeIncident(incident);
    }

    static async updateIncidentStatus(cognitoUser: CognitoUser, incidentId: string, body: any) {
        const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
        if (!isAdmin) {
            throw new AppError({
                statusCode: HTTPStatusCode.FORBIDDEN,
                message: 'Only administrators can update incident status',
                code: 'FORBIDDEN',
            });
        }

        const incident = await this.loadIncidentById(incidentId);
        if (!incident) {
            throw new AppError({
                statusCode: HTTPStatusCode.NOT_FOUND,
                message: 'Incident not found',
                code: 'NOT_FOUND',
            });
        }

        const resolvedAt = body.status === 'RESOLVED' || body.status === 'CLOSED' ? new Date() : null;

        const updatedIncident = await db.incident.update({
            where: { id: incidentId },
            data: {
                status: body.status,
                adminNotes: body.adminNotes ?? incident.adminNotes,
                resolvedAt,
            },
            include: incidentInclude,
        });

        await this.createIncidentNotifications(
            updatedIncident,
            cognitoUser.sub,
            `Incident ${body.status.toLowerCase()}`,
            `Incident ${updatedIncident.id} is now marked as ${body.status.replace(/_/g, ' ').toLowerCase()}.`
        );

        return serializeIncident(updatedIncident);
    }

    static async updateAdminNotes(cognitoUser: CognitoUser, incidentId: string, adminNotes: string) {
        const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
        if (!isAdmin) {
            throw new AppError({
                statusCode: HTTPStatusCode.FORBIDDEN,
                message: 'Only administrators can update incident admin notes',
                code: 'FORBIDDEN',
            });
        }

        const incident = await this.loadIncidentById(incidentId);
        if (!incident) {
            throw new AppError({
                statusCode: HTTPStatusCode.NOT_FOUND,
                message: 'Incident not found',
                code: 'NOT_FOUND',
            });
        }

        const updatedIncident = await db.incident.update({
            where: { id: incidentId },
            data: { adminNotes },
            include: incidentInclude,
        });

        await this.createIncidentNotifications(
            updatedIncident,
            cognitoUser.sub,
            'Incident Note Updated',
            `Admin note updated for incident ${updatedIncident.id}`
        );

        return serializeIncident(updatedIncident);
    }

    static async addMessage(cognitoUser: CognitoUser, incidentId: string, messageText: string) {
        const effectiveUserId = await this.ensureAuthenticatedUserExists(cognitoUser);
        const incident = await this.loadIncidentById(incidentId);
        await this.assertIncidentAccess(incident, cognitoUser);

        await db.incidentMessage.create({
            data: {
                incidentId,
                senderId: effectiveUserId,
                messageText,
            },
        });

        const updatedIncident = await this.loadIncidentById(incidentId);
        if (!updatedIncident) {
            throw new AppError({
                statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
                message: 'Failed to load updated incident',
                code: 'INTERNAL_SERVER_ERROR',
            });
        }

        await this.createIncidentNotifications(
            updatedIncident,
            effectiveUserId,
            'Incident Message Added',
            `A new message has been added to incident ${updatedIncident.id}.`
        );

        return serializeIncident(updatedIncident);
    }

    static async addDocument(cognitoUser: CognitoUser, incidentId: string, body: any) {
        const effectiveUserId = await this.ensureAuthenticatedUserExists(cognitoUser);
        const incident = await this.loadIncidentById(incidentId);
        await this.assertIncidentAccess(incident, cognitoUser);

        await db.incidentDocument.create({
            data: {
                incidentId,
                fileKey: body.fileKey || buildDocumentFileKey(incidentId, body.fileName, body.fileSize),
                documentType: body.documentType,
                uploadedBy: effectiveUserId,
            },
        });

        const updatedIncident = await this.loadIncidentById(incidentId);
        if (!updatedIncident) {
            throw new AppError({
                statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
                message: 'Failed to load updated incident',
                code: 'INTERNAL_SERVER_ERROR',
            });
        }

        return serializeIncident(updatedIncident);
    }
}
