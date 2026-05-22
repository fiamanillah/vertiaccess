import type { Context } from 'hono';
import { sendCreatedResponse } from '@vertiaccess/core';
import { IncidentsService } from '../../services/incidents/incidents.service';
import { createIncidentDocumentSchema } from '../../schemas/incident.schema.ts';

export async function addIncidentDocumentHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as any;
    const incidentId = c.req.param('incidentId');
    const body = c.req.valid('json' as never) as any;
    const data = await IncidentsService.addDocument(cognitoUser, incidentId, body);
    return sendCreatedResponse(c, data, 'Incident document added');
}
