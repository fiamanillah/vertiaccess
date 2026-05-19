import { z } from 'zod';

export const savePaymentMethodSchema = z.object({
    paymentMethodId: z.string().min(1, 'Payment method ID is required'),
    setAsDefault: z.boolean().optional().default(false),
});

export const updatePaymentMethodSchema = z.object({
    name: z.string().min(1, 'Cardholder name is required').optional(),
    expiry: z.string().regex(/^(0[1-9]|1[0-2])\/[0-9]{2}$/, 'Expiry must be in MM/YY format').optional(),
});
