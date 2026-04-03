import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@serverless-backend-starter/database';
import { AppError, HTTPStatusCode, sendResponse, type CognitoUser } from '@serverless-backend-starter/core';
import { stripe } from '../services/billing.service.ts';
import type { activatePlanSchema } from '../schemas/subscribe.schema.ts';

type PlanFeatures = {
    billingType?: 'subscription' | 'payg';
    stripeMonthlyPriceId?: string;
    stripeAnnualPriceId?: string;
    stripePaygPriceId?: string;
};

function parseFeatures(features: unknown): PlanFeatures {
    if (!features || typeof features !== 'object' || Array.isArray(features)) {
        return {};
    }
    return features as PlanFeatures;
}

function minorUnits(amount: number): number {
    return Math.round(amount * 100);
}

export async function activatePlanHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const body = (c.req as any).valid('json') as z.infer<typeof activatePlanSchema>;

    const user = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        include: { operatorProfile: true, landownerProfile: true },
    });

    if (!user) {
        throw new AppError({ statusCode: HTTPStatusCode.NOT_FOUND, message: 'User not found', code: 'NOT_FOUND' });
    }

    const plan = await db.subscriptionPlan.findUnique({ where: { id: body.planId } });
    if (!plan || !plan.isActive) {
        throw new AppError({ statusCode: HTTPStatusCode.NOT_FOUND, message: 'Plan not found or inactive', code: 'NOT_FOUND' });
    }

    const features = parseFeatures(plan.features);
    const billingType = features.billingType || 'subscription';

    const fullName =
        user.operatorProfile?.fullName || user.landownerProfile?.fullName || cognitoUser.email;

    let stripeCustomerId = user.operatorProfile?.stripeCustomerId || null;
    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: cognitoUser.email,
            name: fullName,
            metadata: { userId: user.id },
        });
        stripeCustomerId = customer.id;

        if (user.role === 'OPERATOR' && user.operatorProfile) {
            await db.operatorProfile.update({
                where: { userId: user.id },
                data: { stripeCustomerId },
            });
        }
    }

    await stripe.paymentMethods.attach(body.paymentMethodId, {
        customer: stripeCustomerId,
    });

    await stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: body.paymentMethodId },
    });

    const stripePaymentMethod = await stripe.paymentMethods.retrieve(body.paymentMethodId);
    if (stripePaymentMethod.type === 'card' && stripePaymentMethod.card) {
        await db.paymentMethod.upsert({
            where: { stripePaymentMethodId: stripePaymentMethod.id },
            update: {
                isDefault: true,
            },
            create: {
                userId: user.id,
                stripePaymentMethodId: stripePaymentMethod.id,
                last4: stripePaymentMethod.card.last4,
                brand: stripePaymentMethod.card.brand,
                expiryMonth: String(stripePaymentMethod.card.exp_month).padStart(2, '0'),
                expiryYear: String(stripePaymentMethod.card.exp_year),
                isDefault: true,
            },
        });
    }

    if (billingType === 'payg') {
        const paygPriceId = features.stripePaygPriceId;
        const amount = Number(plan.monthlyPrice);

        const intent = await stripe.paymentIntents.create({
            amount: minorUnits(amount),
            currency: plan.currency.toLowerCase(),
            customer: stripeCustomerId,
            payment_method: body.paymentMethodId,
            confirm: true,
            off_session: true,
            description: `PAYG charge for ${plan.name}`,
            metadata: {
                userId: user.id,
                planId: plan.id,
                planType: 'payg',
                stripePriceId: paygPriceId || '',
            },
        });

        await db.$transaction(async tx => {
            await tx.userSubscription.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    planId: plan.id,
                    status: 'ACTIVE',
                },
                update: {
                    planId: plan.id,
                    status: 'ACTIVE',
                    stripeSubscriptionId: null,
                    cancelAtPeriodEnd: false,
                },
            });

            await tx.transaction.create({
                data: {
                    userId: user.id,
                    amount,
                    currency: plan.currency,
                    transactionType: 'PAYG_BOOKING',
                    status: intent.status === 'succeeded' ? 'charged' : 'pending',
                    stripeChargeId: intent.latest_charge ? String(intent.latest_charge) : null,
                    receiptUrl: (intent as any).charges?.data[0]?.receipt_url || null,
                    pricingBreakdown: {
                        billingType: 'payg',
                        planName: plan.name,
                        stripePriceId: paygPriceId,
                    },
                },
            });
        });

        return sendResponse(c, {
            message: 'PAYG charge completed',
            data: {
                mode: 'payg',
                paymentIntentId: intent.id,
                status: intent.status,
            },
        });
    }

    const priceId =
        body.interval === 'year'
            ? features.stripeAnnualPriceId || features.stripeMonthlyPriceId
            : features.stripeMonthlyPriceId || features.stripeAnnualPriceId;

    if (!priceId) {
        throw new AppError({ statusCode: HTTPStatusCode.BAD_REQUEST, message: 'Plan is missing Stripe price configuration', code: 'BAD_REQUEST' });
    }

    const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        default_payment_method: body.paymentMethodId,
        expand: ['latest_invoice.payment_intent'],
        metadata: {
            userId: user.id,
            planId: plan.id,
            billingType: 'subscription',
        },
    });

    await db.userSubscription.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            planId: plan.id,
            status: String(subscription.status).toUpperCase(),
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: (subscription as any).current_period_start
                ? new Date((subscription as any).current_period_start * 1000)
                : null,
            currentPeriodEnd: (subscription as any).current_period_end
                ? new Date((subscription as any).current_period_end * 1000)
                : null,
            cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        },
        update: {
            planId: plan.id,
            status: String(subscription.status).toUpperCase(),
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: (subscription as any).current_period_start
                ? new Date((subscription as any).current_period_start * 1000)
                : null,
            currentPeriodEnd: (subscription as any).current_period_end
                ? new Date((subscription as any).current_period_end * 1000)
                : null,
            cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        },
    });

    return sendResponse(c, {
        message: 'Subscription activated successfully',
        data: {
            mode: 'subscription',
            subscriptionId: subscription.id,
            status: subscription.status,
        },
    });
}
