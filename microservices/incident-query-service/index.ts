import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { incidentQueryRoutes } from './src/routes.ts';

const app = createServiceApp({
    serviceName: 'incident-query-service',
    basePath: '/incident-queries/v1',
});

app.route('/incident-queries/v1', incidentQueryRoutes);

export const handler = handle(app);
