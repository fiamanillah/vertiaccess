// services/billing-service/src/controllers/subscription-status.ts
import type { Context } from 'hono';
import { db } from '@vertiaccess/database';
import { sendResponse, type CognitoUser } from '@vertiaccess/core';

/**
 * GET /billing/v1/subscriptions/me
 * Returns the current operator's subscription status.
 * Frontend uses this pre-check to decide whether to show the payment gate.
 */
export async function getSubscriptionStatusHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;

    let subscription = await db.userSubscription.findUnique({
        where: { userId: cognitoUser.sub },
        include: { plan: true },
    });

    if (!subscription) {
        // Find the active PAYG plan in the system to auto-subscribe (self-healing)
        const activePlans = await db.subscriptionPlan.findMany({ where: { isActive: true } });
        const paygPlan = activePlans.find((p: any) => {
            try {
                const features = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
                return features?.billingType === 'payg';
            } catch {
                return false;
            }
        });

        if (paygPlan) {
            subscription = await db.userSubscription.create({
                data: {
                    userId: cognitoUser.sub,
                    planId: paygPlan.id,
                    status: 'ACTIVE',
                },
                include: { plan: true },
            });
        }
    }

    if (!subscription) {
        return sendResponse(c, {
            message: 'No active subscription found',
            data: {
                hasActiveSubscription: false,
                status: null,
                planId: null,
                planName: 'No Subscription',
                billingType: null,
                price: null,
                currency: null,
                currentPeriodStart: null,
                currentPeriodEnd: null,
                cancelAtPeriodEnd: false,
            },
        });
    }

    const hasActiveSubscription =
        subscription.status === 'ACTIVE' &&
        (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > new Date());

    const planFeatures = subscription.plan.features && typeof subscription.plan.features === 'object'
        ? (subscription.plan.features as any)
        : {};
    const billingType = planFeatures.billingType || 'subscription';
    const price = billingType === 'payg'
        ? Number(planFeatures.platformFee || subscription.plan.monthlyPrice || 0)
        : Number(subscription.plan.monthlyPrice || 0);

    return sendResponse(c, {
        message: 'Subscription status fetched',
        data: {
            hasActiveSubscription,
            status: subscription.status,
            planId: subscription.plan.id,
            planName: subscription.plan.name,
            billingType,
            price,
            currency: subscription.plan.currency,
            currentPeriodStart: subscription.currentPeriodStart?.toISOString() || null,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
    });
}
