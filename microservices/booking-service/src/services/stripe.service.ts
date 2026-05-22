// services/site-service/src/services/stripe.service.ts
import Stripe from 'stripe';
import { config } from '@vertiaccess/core';

export const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
});
