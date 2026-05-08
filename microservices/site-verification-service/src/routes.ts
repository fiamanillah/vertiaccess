import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@vertiaccess/core';
import { updateSiteStatusSchema } from './schemas/site.schema.ts';
import { updateSiteStatusHandler } from './controllers/sites.ts';

export const siteVerificationRoutes = new Hono();

// Update site status
siteVerificationRoutes.patch(
    '/:siteId/status',
    cognitoAuth(),
    zValidator('json', updateSiteStatusSchema),
    updateSiteStatusHandler
);
