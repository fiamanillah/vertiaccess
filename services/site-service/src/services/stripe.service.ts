// services/site-service/src/services/stripe.service.ts
import Stripe from 'stripe';
import { config } from '@serverless-backend-starter/core';

export const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2024-04-10',
    typescript: true,
});
