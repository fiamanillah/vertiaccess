import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@vertiaccess/core';
import {
    addIncidentDocumentHandler,
    addIncidentMessageHandler,
    createIncidentHandler,
    getIncidentHandler,
    listIncidentsHandler,
    listMyIncidentsHandler,
    listSiteIncidentsHandler,
    updateIncidentStatusHandler,
    updateIncidentAdminNotesHandler,
} from './controllers/incidents.ts';
import {
    createIncidentDocumentSchema,
    createIncidentMessageSchema,
    createIncidentSchema,
    updateIncidentStatusSchema,
} from './schemas/incident.schema.ts';

// Admin-only: update admin notes without changing status
incidentRoutes.patch('/:incidentId/notes', cognitoAuth(), async c => {
    // simple validator: expect JSON { adminNotes: string | null }
    return updateIncidentAdminNotesHandler(c as any);
});
export const incidentRoutes = new Hono();

incidentRoutes.get('/', cognitoAuth(), listIncidentsHandler);
incidentRoutes.get('/mine', cognitoAuth(), listMyIncidentsHandler);
incidentRoutes.get('/site/:siteId', cognitoAuth(), listSiteIncidentsHandler);
incidentRoutes.get('/:incidentId', cognitoAuth(), getIncidentHandler);
incidentRoutes.post(
    '/',
    cognitoAuth(),
    zValidator('json', createIncidentSchema),
    createIncidentHandler
);
incidentRoutes.patch(
    '/:incidentId/status',
    cognitoAuth(),
    zValidator('json', updateIncidentStatusSchema),
    updateIncidentStatusHandler
);
incidentRoutes.post(
    '/:incidentId/messages',
    cognitoAuth(),
    zValidator('json', createIncidentMessageSchema),
    addIncidentMessageHandler
);
incidentRoutes.post(
    '/:incidentId/documents',
    cognitoAuth(),
    zValidator('json', createIncidentDocumentSchema),
    addIncidentDocumentHandler
);
