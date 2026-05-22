import type { Context } from 'hono';
import { sendResponse } from '@vertiaccess/core';
import { IncidentsService } from '../../services/incidents/incidents.service';

export async function listIncidentsHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as any;
    const data = await IncidentsService.listIncidents(cognitoUser);
    return sendResponse(c, { message: 'Incidents retrieved successfully', data });
}
