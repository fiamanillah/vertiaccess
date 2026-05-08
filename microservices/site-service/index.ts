// services/site-service/index.ts
import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { siteRoutes } from './src/routes';

const app = createServiceApp({
    serviceName: 'site-service',
    basePath: '/sites/v1',
});

app.route('/sites/v1', siteRoutes);

export const handler = handle(app);
