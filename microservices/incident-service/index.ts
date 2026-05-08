import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { incidentRoutes } from './src/routes.ts';

const app = createServiceApp({
    serviceName: 'incident-service',
    basePath: '/incidents/v1',
});

app.route('/incidents/v1', incidentRoutes);

export const handler = handle(app);
