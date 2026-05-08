import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { notificationRoutes } from './src/routes.ts';

const app = createServiceApp({
    serviceName: 'notification-service',
    basePath: '/notifications/v1',
});

app.route('/notifications/v1', notificationRoutes);

export const handler = handle(app);
