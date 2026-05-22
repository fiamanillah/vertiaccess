import { db } from '@vertiaccess/database';
import { AppError, HTTPStatusCode, type CognitoUser } from '@vertiaccess/core';
import { ensureAuthenticatedUserExists } from './ensure-user.action';
import { incidentInclude, serializeIncident } from './helpers';

export async function getIncidentAction(cognitoUser: CognitoUser, incidentId: string) {
    await ensureAuthenticatedUserExists(cognitoUser);
    const incident = await db.incident.findUnique({
        where: { id: incidentId },
        include: incidentInclude,
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

    return serializeIncident(incident);
}
