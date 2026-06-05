import type { Context } from 'hono';
import { db } from '@vertiaccess/database';
import { AppError, HTTPStatusCode, sendResponse, type CognitoUser } from '@vertiaccess/core';

function requireAdmin(c: Context) {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    if ((cognitoUser?.role || '').toLowerCase() !== 'admin') {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Admin role required',
            code: 'FORBIDDEN',
        });
    }
}

export async function listSubscriptionsHandler(c: Context): Promise<Response> {
    requireAdmin(c);

    const subscriptions = await db.userSubscription.findMany({
        include: {
            plan: true,
            user: {
                include: {
                    operatorProfile: true,
                    assetOwnerProfile: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    const data = subscriptions.map(sub => {
        const fullName =
            sub.user.operatorProfile?.fullName ||
            sub.user.assetOwnerProfile?.fullName ||
            sub.user.email;
        const organisation =
            sub.user.operatorProfile?.organisation ||
            sub.user.assetOwnerProfile?.organisation ||
            '';

        return {
            id: sub.id,
            userId: sub.userId,
            name: fullName,
            email: sub.user.email,
            organisation,
            planName: sub.plan.name,
            planId: sub.plan.id,
            billingType: (sub.plan.features as any)?.billingType || 'subscription',
            price: Number(sub.plan.monthlyPrice?.toString() || 0),
            status: sub.status,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            currentPeriodStart: sub.currentPeriodStart ? sub.currentPeriodStart.toISOString() : null,
            currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
            joined: sub.createdAt.toISOString(),
        };
    });

    return sendResponse(c, {
        message: 'Subscriptions fetched successfully',
        data,
    });
}

export async function getSubscriptionMetricsHandler(c: Context): Promise<Response> {
    requireAdmin(c);

    // 1. Fetch active subscriptions for Active Subscribers and MRR
    const activeSubs = await db.userSubscription.findMany({
        where: {
            status: {
                in: ['ACTIVE', 'active', 'trialing', 'TRIALING', 'active_recurring'],
            },
        },
        include: {
            plan: true,
        },
    });

    const activeSubscribers = activeSubs.length;

    let mrr = 0;
    for (const sub of activeSubs) {
        const features = (sub.plan.features as any) || {};
        if (features.billingType === 'payg') {
            continue; // PAYG is not recurring revenue
        }

        const monthlyPrice = Number(sub.plan.monthlyPrice?.toString() || 0);
        const annualPrice = Number(sub.plan.annualPrice?.toString() || 0);

        // Detect if subscription is annual (approx > 300 days)
        let isAnnual = false;
        if (sub.currentPeriodStart && sub.currentPeriodEnd) {
            const diffTime = Math.abs(sub.currentPeriodEnd.getTime() - sub.currentPeriodStart.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 300) {
                isAnnual = true;
            }
        }

        if (isAnnual && annualPrice > 0) {
            mrr += annualPrice / 12;
        } else {
            mrr += monthlyPrice;
        }
    }

    // 2. Fetch PAYG fees (MTD)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const paygTransactions = await db.transaction.findMany({
        where: {
            transactionType: 'PAYG_BOOKING',
            status: 'charged',
            createdAt: {
                gte: startOfMonth,
            },
        },
    });

    const paygFeesMtd = paygTransactions.reduce((acc, tx) => acc + Number(tx.amount.toString()), 0);

    return sendResponse(c, {
        message: 'Metrics fetched successfully',
        data: {
            mrr,
            paygFeesMtd,
            activeSubscribers,
        },
    });
}
