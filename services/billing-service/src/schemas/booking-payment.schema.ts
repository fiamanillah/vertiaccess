// services/billing-service/src/schemas/booking-payment.schema.ts
import { z } from 'zod';

export const bookingPaymentSchema = z.object({
    siteId: z.string().min(1, 'Site ID is required'),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().default('GBP'),
});
