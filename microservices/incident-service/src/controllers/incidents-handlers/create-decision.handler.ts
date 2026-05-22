import type { Context } from 'hono';
import { sendResponse } from '@vertiaccess/core';
import { IncidentsService } from '../../services/incidents/incidents.service';
import { createIncidentDecisionSchema } from '../../schemas/incident.schema.ts';

export async function createIncidentDecisionHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as any;
    const incidentId = c.req.param('incidentId');
    const body = c.req.valid('json' as never) as any;
    const data = await IncidentsService.createDecision(cognitoUser, incidentId, body);
    return sendResponse(c, { message: 'Incident decision recorded successfully', data });
}
