import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { documentRoutes } from './src/routes.ts';

const app = createServiceApp({
    serviceName: 'document-service',
    basePath: '/documents/v1',
});

app.route('/documents/v1', documentRoutes);

export const handler = handle(app);
