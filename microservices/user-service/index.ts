import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { authRoutes as userRoutes } from './src/routes.ts';

const app = createServiceApp({
    serviceName: 'user-service',
    basePath: '/users/v1',
});

app.route('/users/v1', userRoutes);

export const handler = handle(app);
