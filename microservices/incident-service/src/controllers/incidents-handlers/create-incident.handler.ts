import type { Context } from 'hono';
import { sendCreatedResponse } from '@vertiaccess/core';
import { IncidentsService } from '../../services/incidents/incidents.service';
import { createIncidentSchema } from '../../schemas/incident.schema.ts';

export async function createIncidentHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as any;
    const body = c.req.valid('json' as never) as any;
    const pathBookingId = c.req.param('bookingId') || undefined;
    const data = await IncidentsService.createIncident(cognitoUser, body, pathBookingId);
    return sendCreatedResponse(c, data, 'Incident report created');
}
