import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { bookingQueryRoutes } from './src/routes.ts';

const app = createServiceApp({
    serviceName: 'booking-query-service',
    basePath: '/booking-queries/v1',
});

app.route('/booking-queries/v1', bookingQueryRoutes);

export const handler = handle(app);
