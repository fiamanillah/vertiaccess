// services/billing-service/src/schemas/withdrawal.schema.ts
import { z } from 'zod';

export const createWithdrawalRequestSchema = z.object({
    amount: z
        .number()
        .positive('Amount must be positive')
        .min(20, 'Minimum withdrawal amount is £20'),
});

export const connectStripeAccountSchema = z.object({
    country: z.string().length(2, 'Country code must be 2 characters').default('GB'),
});
