import { db } from '@vertiaccess/database';
import { AppError, HTTPStatusCode, type CognitoUser } from '@vertiaccess/core';
import { incidentInclude, serializeIncident } from './helpers';
import { createIncidentNotifications } from './notifications.service';

export async function updateAdminNotesAction(
    cognitoUser: CognitoUser,
    incidentId: string,
    adminNotes: string,
) {
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
    if (!isAdmin) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Only administrators can update incident admin notes',
            code: 'FORBIDDEN',
        });
    }

    const incident = await db.incident.findUnique({
        where: { id: incidentId },
    });
    if (!incident) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Incident not found',
            code: 'NOT_FOUND',
        });
    }

    await db.incident.update({
        where: { id: incidentId },
        data: { adminNotes },
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
        cognitoUser.sub,
        'Incident Note Updated',
        `Admin note updated for incident ${updatedIncident.id}`,
    );

    return serializeIncident(updatedIncident);
}
