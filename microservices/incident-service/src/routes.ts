import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@vertiaccess/core';
import {
    addIncidentDocumentHandler,
    addIncidentMessageHandler,
    createIncidentHandler,
    createIncidentDecisionHandler,
    updateIncidentStatusHandler,
    updateIncidentAdminNotesHandler,
} from './controllers/incidents.ts';
import {
    createIncidentDocumentSchema,
    createIncidentDecisionSchema,
    createIncidentMessageSchema,
    createIncidentSchema,
    updateIncidentStatusSchema,
} from './schemas/incident.schema.ts';

export const incidentRoutes = new Hono();

// Admin-only: update admin notes without changing status
incidentRoutes.patch('/:incidentId/notes', cognitoAuth(), updateIncidentAdminNotesHandler);

incidentRoutes.post(
    '/',
    cognitoAuth(),
    zValidator('json', createIncidentSchema),
    createIncidentHandler
);
incidentRoutes.post(
    '/bookings/:bookingId/incidents',
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
    '/:incidentId/decision',
    cognitoAuth(),
    zValidator('json', createIncidentDecisionSchema),
    createIncidentDecisionHandler
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
