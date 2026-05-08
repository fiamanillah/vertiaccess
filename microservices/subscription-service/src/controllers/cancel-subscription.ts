// services/billing-service/src/controllers/cancel-subscription.ts
import type { Context } from 'hono';
import { db } from '@vertiaccess/database';
import { sendResponse, AppError, HTTPStatusCode, type CognitoUser } from '@vertiaccess/core';
import { stripe } from '../services/billing.service.ts';
import { toStripeAppError } from '../utils/stripe-error.ts';

export async function cancelSubscriptionHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;

    const body = await c.req.json().catch(() => ({}));
    const immediate = Boolean(body?.immediate);

    const subscription = await db.userSubscription.findUnique({
        where: { userId: cognitoUser.sub },
        include: { plan: true },
    });

    if (!subscription) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'No active subscription found',
            code: 'NOT_FOUND',
        });
    }

    // If there's no Stripe subscription id (PAYG or legacy), mark cancelled locally
    if (!subscription.stripeSubscriptionId) {
        await db.userSubscription.update({
            where: { userId: cognitoUser.sub },
            data: { status: 'CANCELLED', cancelAtPeriodEnd: false },
        });
        return sendResponse(c, {
            message: 'Subscription cancelled',
            data: { immediate: true, cancelAtPeriodEnd: false },
        });
    }

    try {
        if (immediate) {
            await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
            await db.userSubscription.update({
                where: { userId: cognitoUser.sub },
                data: {
                    status: 'CANCELLED',
                    cancelAtPeriodEnd: false,
                    currentPeriodEnd: new Date(),
                },
            });
            return sendResponse(c, {
                message: 'Subscription cancelled immediately',
                data: { immediate: true },
            });
        }

        // Schedule cancellation at period end
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });
        await db.userSubscription.update({
            where: { userId: cognitoUser.sub },
            data: { cancelAtPeriodEnd: true },
        });
        return sendResponse(c, {
            message: 'Subscription will cancel at period end',
            data: { immediate: false, cancelAtPeriodEnd: true },
        });
    } catch (error: any) {
        throw toStripeAppError(error);
    }
}
