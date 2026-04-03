// services/billing-service/src/routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@serverless-backend-starter/core';
import { checkoutHandler } from './controllers/checkout.ts';
import { checkoutSchema } from './schemas/checkout.schema.ts';
import { webhookHandler } from './controllers/webhook.ts';
import { activatePlanHandler } from './controllers/subscribe.ts';
import { activatePlanSchema } from './schemas/subscribe.schema.ts';
import {
    listPlansHandler,
    createPlanHandler,
    updatePlanHandler,
    deletePlanHandler,
} from './controllers/plans.ts';
import { createPlanSchema, updatePlanSchema } from './schemas/plans.schema.ts';

export const billingRoutes = new Hono();

// Public plan list for onboarding/pricing cards
billingRoutes.get('/plans', listPlansHandler);

// Plan management (admin)
billingRoutes.post(
    '/plans',
    cognitoAuth(),
    zValidator('json', createPlanSchema),
    createPlanHandler
);

billingRoutes.patch(
    '/plans/:planId',
    cognitoAuth(),
    zValidator('json', updatePlanSchema),
    updatePlanHandler
);

billingRoutes.delete('/plans/:planId', cognitoAuth(), deletePlanHandler);

// Generate checkout session (Requires auth)
billingRoutes.post(
    '/checkout',
    cognitoAuth(),
    zValidator('json', checkoutSchema.body),
    checkoutHandler
);

// Stripe Webhook (No auth, validated via stripe-signature)
billingRoutes.post('/webhook', webhookHandler);

// Process Subscription & Payment
billingRoutes.post(
    '/subscriptions/activate',
    cognitoAuth(),
    zValidator('json', activatePlanSchema),
    activatePlanHandler
);
