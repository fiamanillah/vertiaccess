import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { documentRoutes } from './src/routes.ts';

const app = createServiceApp({
    serviceName: 'media-service',
});

// Mount routes on both generic and legacy paths
app.route('/media/v1', documentRoutes);
app.route('/documents/v1', documentRoutes);

export const handler = handle(app);
