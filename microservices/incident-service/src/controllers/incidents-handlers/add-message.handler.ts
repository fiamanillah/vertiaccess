import type { Context } from 'hono';
import { sendCreatedResponse } from '@vertiaccess/core';
import { IncidentsService } from '../../services/incidents/incidents.service';
import { createIncidentMessageSchema } from '../../schemas/incident.schema.ts';

export async function addIncidentMessageHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as any;
    const incidentId = c.req.param('incidentId');
    const body = c.req.valid('json' as never) as any;
    const data = await IncidentsService.addMessage(cognitoUser, incidentId, body);
    return sendCreatedResponse(c, data, 'Incident message added');
}
