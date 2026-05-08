import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { subscriptionRoutes } from './src/routes.ts';

const app = createServiceApp({
    serviceName: 'subscription-service',
    basePath: '/subscriptions/v1',
});

app.route('/subscriptions/v1', subscriptionRoutes);

export const handler = handle(app);
