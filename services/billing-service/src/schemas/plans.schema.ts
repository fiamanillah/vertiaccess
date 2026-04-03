import { z } from 'zod';

export const createPlanSchema = z.object({
    name: z.string().min(2),
    billingType: z.enum(['subscription', 'payg']),
    monthlyPrice: z.number().nonnegative(),
    annualPrice: z.number().nonnegative().optional(),
    currency: z.string().min(3).max(3).default('GBP'),
    description: z.string().optional(),
    unitLabel: z.string().optional(),
    isActive: z.boolean().optional(),
});

export const updatePlanSchema = z.object({
    name: z.string().min(2).optional(),
    monthlyPrice: z.number().nonnegative().optional(),
    annualPrice: z.number().nonnegative().optional(),
    currency: z.string().min(3).max(3).optional(),
    description: z.string().optional(),
    unitLabel: z.string().optional(),
    isActive: z.boolean().optional(),
});
