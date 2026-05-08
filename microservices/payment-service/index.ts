import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { paymentRoutes } from './src/routes.ts';

const app = createServiceApp({
    serviceName: 'payment-service',
    basePath: '/payments/v1',
});

app.route('/payments/v1', paymentRoutes);

export const handler = handle(app);
