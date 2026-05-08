import { z } from 'zod';

export const activatePlanSchema = z.object({
    planId: z.string().uuid(),
    paymentMethodId: z.string().min(1),
    interval: z.enum(['month', 'year']).optional(),
});
