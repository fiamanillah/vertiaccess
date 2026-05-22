import type { Context } from 'hono';
import { sendResponse } from '@vertiaccess/core';
import { IncidentsService } from '../../services/incidents/incidents.service';

export async function updateIncidentAdminNotesHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as any;
    const incidentId = c.req.param('incidentId');
    const body = await c.req.json();
    const adminNotes = (body && body.adminNotes) || '';
    const data = await IncidentsService.updateAdminNotes(cognitoUser, incidentId, adminNotes);
    return sendResponse(c, { message: 'Incident admin notes updated', data });
}
