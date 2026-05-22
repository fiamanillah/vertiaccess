import { db } from '@vertiaccess/database';
import { AppError, HTTPStatusCode, type CognitoUser } from '@vertiaccess/core';
import { ensureAuthenticatedUserExists } from './ensure-user.action';
import {
    buildDocumentFileKey,
    incidentInclude,
    serializeIncident,
} from './helpers';
import { createIncidentNotifications } from './notifications.service';

export async function addIncidentDocumentAction(
    cognitoUser: CognitoUser,
    incidentId: string,
    body: any,
) {
    const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser);
    const incident = await db.incident.findUnique({
        where: { id: incidentId },
        select: { id: true, reporterId: true, site: { select: { landownerId: true } } },
    });
    if (!incident) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Incident not found',
            code: 'NOT_FOUND',
        });
    }

    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
    if (!isAdmin) {
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

    await db.incidentDocument.create({
        data: {
            incidentId,
            fileKey:
                body.fileKey ||
                buildDocumentFileKey(incidentId, body.fileName, body.fileSize),
            documentType: body.documentType,
            uploadedBy: effectiveUserId,
        },
    });

    const updatedIncident = await db.incident.findUnique({
        where: { id: incidentId },
        include: incidentInclude,
    });
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
        `A document has been attached to incident ${updatedIncident.id}.`,
    );

    return serializeIncident(updatedIncident);
}
