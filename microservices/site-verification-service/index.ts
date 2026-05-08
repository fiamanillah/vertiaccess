import { handle } from 'hono/aws-lambda';
import { createServiceApp } from '@vertiaccess/core';
import { siteVerificationRoutes } from './src/routes.ts';

const app = createServiceApp({
    serviceName: 'site-verification-service',
    basePath: '/site-verifications/v1',
});

app.route('/site-verifications/v1', siteVerificationRoutes);

export const handler = handle(app);
