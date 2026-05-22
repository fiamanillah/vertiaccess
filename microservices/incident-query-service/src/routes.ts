import { Hono } from 'hono';
import { cognitoAuth } from '@vertiaccess/core';
import {
    getIncidentHandler,
    listIncidentsHandler,
    listBookingIncidentsHandler,
    listMyIncidentsHandler,
    listSiteIncidentsHandler,
} from './controllers/incidents.ts';

export const incidentQueryRoutes = new Hono();

incidentQueryRoutes.get('/', cognitoAuth(), listIncidentsHandler);
incidentQueryRoutes.get('/mine', cognitoAuth(), listMyIncidentsHandler);
incidentQueryRoutes.get('/site/:siteId', cognitoAuth(), listSiteIncidentsHandler);
incidentQueryRoutes.get('/booking/:bookingId', cognitoAuth(), listBookingIncidentsHandler);
incidentQueryRoutes.get('/:incidentId', cognitoAuth(), getIncidentHandler);
