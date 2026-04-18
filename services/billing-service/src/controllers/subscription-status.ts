// services/billing-service/src/controllers/subscription-status.ts
import type { Context } from 'hono';
import { db } from '@serverless-backend-starter/database';
import { sendResponse, type CognitoUser } from '@serverless-backend-starter/core';

/**
 * GET /billing/v1/subscriptions/me
 * Returns the current operator's subscription status.
 * Frontend uses this pre-check to decide whether to show the payment gate.
 */
export async function getSubscriptionStatusHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;

    const subscription = await db.userSubscription.findUnique({
        where: { userId: cognitoUser.sub },
        include: { plan: true },
    });

    if (!subscription) {
        return sendResponse(c, {
            message: 'No subscription found',
            data: {
                hasActiveSubscription: false,
                status: null,
                planName: null,
                currentPeriodEnd: null,
            },
        });
    }

    const hasActiveSubscription =
        subscription.status === 'ACTIVE' &&
        (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > new Date());

    return sendResponse(c, {
        message: 'Subscription status fetched',
        data: {
            hasActiveSubscription,
            status: subscription.status,
            planName: subscription.plan.name,
            currentPeriodStart: subscription.currentPeriodStart?.toISOString() || null,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
    });
}
