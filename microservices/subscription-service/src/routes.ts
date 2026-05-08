import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@vertiaccess/core';
import { activatePlanHandler } from './controllers/subscribe.ts';
import { activatePlanSchema } from './schemas/subscribe.schema.ts';
import {
    listPlansHandler,
    createPlanHandler,
    updatePlanHandler,
    deletePlanHandler,
} from './controllers/plans.ts';
import { createPlanSchema, updatePlanSchema } from './schemas/plans.schema.ts';
import { getSubscriptionStatusHandler } from './controllers/subscription-status.ts';
import { cancelSubscriptionHandler } from './controllers/cancel-subscription.ts';

export const subscriptionRoutes = new Hono();

// Public plan list for onboarding/pricing cards
subscriptionRoutes.get('/plans', listPlansHandler);

// Plan management (admin)
subscriptionRoutes.post(
    '/plans',
    cognitoAuth(),
    zValidator('json', createPlanSchema),
    createPlanHandler
);

subscriptionRoutes.patch(
    '/plans/:planId',
    cognitoAuth(),
    zValidator('json', updatePlanSchema),
    updatePlanHandler
);

subscriptionRoutes.delete('/plans/:planId', cognitoAuth(), deletePlanHandler);

// Process Subscription & Payment
subscriptionRoutes.post(
    '/activate',
    cognitoAuth(),
    zValidator('json', activatePlanSchema),
    activatePlanHandler
);

// Subscription status check (used by frontend before booking)
subscriptionRoutes.get('/me', cognitoAuth(), getSubscriptionStatusHandler);

// Cancel subscription (immediate or at period end)
subscriptionRoutes.post('/cancel', cognitoAuth(), cancelSubscriptionHandler);
