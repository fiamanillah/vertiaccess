import type { Context } from 'hono';
import { sendResponse } from '@vertiaccess/core';
import { IncidentsService } from '../../services/incidents/incidents.service';

export async function getIncidentHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as any;
    const incidentId = c.req.param('incidentId');
    const data = await IncidentsService.getIncident(cognitoUser, incidentId);
    return sendResponse(c, { message: 'Incident retrieved successfully', data });
}
