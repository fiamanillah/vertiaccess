import { z } from 'zod';

export const savePaymentMethodSchema = z.object({
    paymentMethodId: z.string().min(1, 'Payment method ID is required'),
    setAsDefault: z.boolean().optional().default(false),
});
