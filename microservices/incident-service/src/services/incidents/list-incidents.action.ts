import { db } from '@vertiaccess/database';
import type { CognitoUser } from '@vertiaccess/core';
import { ensureAuthenticatedUserExists } from './ensure-user.action';
import { incidentInclude, serializeIncident } from './helpers';

export async function listIncidentsAction(cognitoUser: CognitoUser) {
    await ensureAuthenticatedUserExists(cognitoUser);
    const role = (cognitoUser.role || '').toLowerCase();
    const isAdmin = role === 'admin';

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
