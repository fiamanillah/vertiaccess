// services/booking-service/index.ts
import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { bookingRoutes } from './src/routes';

const app = createServiceApp({
    serviceName: 'booking-service',
    basePath: '/bookings/v1',
});

app.route('/bookings/v1', bookingRoutes);

export const handler = handle(app);
