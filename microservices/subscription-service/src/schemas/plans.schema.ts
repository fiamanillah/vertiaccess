import { z } from 'zod';

export const createPlanSchema = z
    .object({
        name: z.string().min(2),
        billingType: z.enum(['subscription', 'payg']),
        monthlyPrice: z.number().nonnegative().optional(),
        platformFee: z.number().nonnegative().optional(),
        annualPrice: z.number().nonnegative().optional(),
        includedBookings: z.number().int().nonnegative().optional(),
        currency: z.string().min(3).max(3).default('GBP'),
        description: z.string().optional(),
        unitLabel: z.string().optional(),
        isActive: z.boolean().optional(),
        customFeatures: z.array(
            z.object({
                id: z.string().optional(),
                name: z.string().min(1),
                included: z.boolean()
            })
        ).optional(),
        limits: z.object({
            maxSites: z.number().int().optional(),
            monthlyBookings: z.number().int().optional(),
        }).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.billingType === 'payg' && typeof data.platformFee !== 'number') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['platformFee'],
                message: 'platformFee is required for payg plans',
            });
        }

        if (data.billingType === 'subscription' && typeof data.monthlyPrice !== 'number') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['monthlyPrice'],
                message: 'monthlyPrice is required for subscription plans',
            });
        }
    });

export const updatePlanSchema = z.object({
    name: z.string().min(2).optional(),
    monthlyPrice: z.number().nonnegative().optional(),
    platformFee: z.number().nonnegative().optional(),
    annualPrice: z.number().nonnegative().optional(),
    includedBookings: z.number().int().nonnegative().optional(),
    currency: z.string().min(3).max(3).optional(),
    description: z.string().optional(),
    unitLabel: z.string().optional(),
    isActive: z.boolean().optional(),
    customFeatures: z.array(
        z.object({
            id: z.string().optional(),
            name: z.string().min(1),
            included: z.boolean()
        })
    ).optional(),
    limits: z.object({
        maxSites: z.number().int().optional(),
        monthlyBookings: z.number().int().optional(),
    }).optional(),
});
