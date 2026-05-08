import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { authRoutes as adminRoutes } from './src/routes.ts';

const app = createServiceApp({
    serviceName: 'admin-service',
    basePath: '/admin/v1',
});

app.route('/admin/v1', adminRoutes);

export const handler = handle(app);
