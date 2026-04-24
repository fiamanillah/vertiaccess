// services/billing-service/src/controllers/withdrawal.ts
import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    sendResponse,
    sendCreatedResponse,
    type CognitoUser,
} from '@vertiaccess/core';
import { stripe } from '../services/billing.service.ts';
import {
    createWithdrawalRequestSchema,
    connectStripeAccountSchema,
} from '../schemas/withdrawal.schema.ts';

function isStripeConnectNotEnabledError(err: any): boolean {
    const message = String(err?.message || '').toLowerCase();
    return (
        message.includes('signed up for connect') ||
        message.includes('you can only create new accounts')
    );
}

function isStripeExpressCountryNotEnabledError(err: any): boolean {
    const message = String(err?.message || '').toLowerCase();
    return (
        message.includes('country that is not enabled for express') ||
        message.includes('enable gb in your country and capabilities settings') ||
        message.includes('capabilities when creating an account link')
    );
}

/**
 * Helper: Get or calculate landowner balance
 */
async function getLandownerBalance(landownerId: string) {
    let balance = await db.landownerBalance.findUnique({
        where: { landownerId },
    });

    if (!balance) {
        // Calculate from all approved bookings where payment is charged
        const bookings = await db.booking.findMany({
            where: {
                site: { landownerId },
                status: 'APPROVED',
                paymentStatus: 'charged',
            },
            select: {
                toalCost: true,
                id: true,
            },
        });

        const totalEarned = bookings.reduce((sum, b) => {
            return sum + (Number(b.toalCost) || 0);
        }, 0);

        // Check for withdrawals
        const withdrawn = await db.withdrawalRequest.findMany({
            where: {
                landownerId,
                status: 'COMPLETED',
            },
            select: { amount: true },
        });

        const totalWithdrawn = withdrawn.reduce((sum, w) => {
            return sum + Number(w.amount);
        }, 0);

        const available = totalEarned - totalWithdrawn;

        balance = await db.landownerBalance.create({
            data: {
                landownerId,
                availableBalance: available,
                withdrawnBalance: totalWithdrawn,
                currency: 'GBP',
            },
        });
    }

    return balance;
}

/**
 * POST /billing/v1/landowner/stripe-connect
 * Create or update Stripe Connect account for landowner
 */
export async function connectStripeAccountHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const body = (c.req as any).valid('json') as z.infer<typeof connectStripeAccountSchema>;

    const user = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        include: { landownerProfile: true },
    });

    if (!user || user.role !== 'LANDOWNER') {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Only landowners can connect Stripe accounts',
            code: 'FORBIDDEN',
        });
    }

    if (!user.landownerProfile) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Landowner profile not found',
            code: 'BAD_REQUEST',
        });
    }

    try {
        let stripeAccountId = user.landownerProfile.stripeAccountId;

        if (!stripeAccountId) {
            // Create new Stripe Connect account
            const account = await stripe.accounts.create({
                type: 'express',
                country: body.country,
                email: user.email,
                capabilities: {
                    transfers: { requested: true },
                },
                business_type: 'individual',
                individual: {
                    email: user.email,
                },
                business_profile: {
                    mcc: '7011', // Lessors of nonresidential buildings
                    url: 'https://vertiaccess.app',
                    support_email: user.email,
                },
                metadata: {
                    userId: user.id,
                    landowners: 'true',
                },
            });

            stripeAccountId = account.id;

            // Save to database
            await db.landownerProfile.update({
                where: { userId: user.id },
                data: { stripeAccountId },
            });
        }

        // Generate onboarding link
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            type: 'account_onboarding',
            refresh_url: 'https://vertiaccess.app/dashboard/landowner?stripe_reconnect=true',
            return_url: 'https://vertiaccess.app/dashboard/landowner?stripe_connected=true',
        });

        return sendResponse(c, {
            message: 'Stripe Connect account prepared',
            data: {
                accountId: stripeAccountId,
                onboardingUrl: accountLink.url,
            },
        });
    } catch (err: any) {
        if (isStripeConnectNotEnabledError(err)) {
            throw new AppError({
                statusCode: HTTPStatusCode.BAD_REQUEST,
                message:
                    'Stripe Connect is not enabled for this Stripe account. Enable Connect at https://dashboard.stripe.com/connect, then try again.',
                code: 'STRIPE_CONNECT_NOT_ENABLED',
            });
        }

        if (isStripeExpressCountryNotEnabledError(err)) {
            throw new AppError({
                statusCode: HTTPStatusCode.BAD_REQUEST,
                message:
                    'Stripe Express is not enabled for GB on this platform account. Enable GB in Country and Capabilities: https://dashboard.stripe.com/settings/applications/express, then retry.',
                code: 'STRIPE_EXPRESS_COUNTRY_NOT_ENABLED',
            });
        }

        throw new AppError({
            statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
            message: `Failed to connect Stripe account: ${err.message}`,
            code: 'STRIPE_ERROR',
        });
    }
}

/**
 * GET /billing/v1/landowner/balance
 * Get landowner's current balance (available, pending, withdrawn)
 */
export async function getLandownerBalanceHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;

    const user = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        include: { landownerProfile: { select: { stripeAccountId: true } } },
    });

    if (!user || user.role !== 'LANDOWNER') {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Only landowners can view balance',
            code: 'FORBIDDEN',
        });
    }

    const balance = await getLandownerBalance(user.id);

    return sendResponse(c, {
        message: 'Balance retrieved successfully',
        data: {
            availableBalance: balance.availableBalance,
            pendingBalance: balance.pendingBalance,
            withdrawnBalance: balance.withdrawnBalance,
            currency: balance.currency,
            lastCalculatedAt: balance.lastCalculatedAt,
            stripeConnected: Boolean(user.landownerProfile?.stripeAccountId),
            totalEarned:
                Number(balance.availableBalance) +
                Number(balance.pendingBalance) +
                Number(balance.withdrawnBalance),
        },
    });
}

/**
 * POST /billing/v1/landowner/withdrawals
 * Create a new withdrawal request
 */
export async function createWithdrawalRequestHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const body = (c.req as any).valid('json') as z.infer<typeof createWithdrawalRequestSchema>;

    const user = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        include: { landownerProfile: true },
    });

    if (!user || user.role !== 'LANDOWNER') {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Only landowners can create withdrawals',
            code: 'FORBIDDEN',
        });
    }

    if (!user.landownerProfile?.stripeAccountId) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Stripe Connect account not set up. Please connect your bank account first.',
            code: 'NO_STRIPE_ACCOUNT',
        });
    }

    const balance = await getLandownerBalance(user.id);

    if (Number(balance.availableBalance) < body.amount) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: `Insufficient balance. Available: £${balance.availableBalance}`,
            code: 'INSUFFICIENT_BALANCE',
        });
    }

    try {
        // Create payout in Stripe
        const payout = await stripe.payouts.create(
            {
                amount: Math.round(body.amount * 100), // Convert to pence
                currency: 'gbp',
                method: 'instant',
                statement_descriptor: 'VertIAccess Withdrawal',
            },
            {
                stripeAccount: user.landownerProfile.stripeAccountId,
            }
        );

        // Create withdrawal request in database
        const withdrawal = await db.withdrawalRequest.create({
            data: {
                balanceId: balance.id,
                landownerId: user.id,
                amount: body.amount,
                currency: 'GBP',
                status: 'IN_PROGRESS',
                stripePayoutId: payout.id,
            },
        });

        const payoutSnapshot = {
            id: payout.id,
            amount: payout.amount,
            currency: payout.currency,
            status: payout.status,
            created: payout.created,
            arrival_date: payout.arrival_date,
            method: payout.method,
            destination:
                typeof payout.destination === 'string'
                    ? payout.destination
                    : payout.destination?.id || null,
            failure_code: payout.failure_code,
            failure_message: payout.failure_message,
            type: payout.type,
        };

        // Create withdrawal transaction record
        await db.withdrawalTransaction.create({
            data: {
                withdrawalId: withdrawal.id,
                landownerId: user.id,
                amount: body.amount,
                currency: 'GBP',
                stripePayout: payoutSnapshot,
                status: payout.status,
            },
        });

        // Update balance
        await db.landownerBalance.update({
            where: { id: balance.id },
            data: {
                availableBalance: Number(balance.availableBalance) - body.amount,
                pendingBalance: Number(balance.pendingBalance) + body.amount,
            },
        });

        return sendCreatedResponse(c, {
            message: 'Withdrawal request created successfully',
            data: {
                id: withdrawal.id,
                amount: withdrawal.amount,
                status: withdrawal.status,
                stripePayoutId: payout.id,
                requestedAt: withdrawal.requestedAt,
            },
        });
    } catch (err: any) {
        throw new AppError({
            statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
            message: `Failed to process withdrawal: ${err.message}`,
            code: 'PAYOUT_ERROR',
        });
    }
}

/**
 * GET /billing/v1/landowner/withdrawals
 * Get withdrawal history for landowner
 */
export async function listWithdrawalsHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;

    const user = await db.user.findUnique({
        where: { id: cognitoUser.sub },
    });

    if (!user || user.role !== 'LANDOWNER') {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Only landowners can view withdrawals',
            code: 'FORBIDDEN',
        });
    }

    const withdrawals = await db.withdrawalRequest.findMany({
        where: { landownerId: user.id },
        include: {
            transactions: true,
        },
        orderBy: { requestedAt: 'desc' },
    });

    return sendResponse(c, {
        message: 'Withdrawals retrieved successfully',
        data: withdrawals.map(w => ({
            id: w.id,
            amount: w.amount,
            currency: w.currency,
            status: w.status,
            requestedAt: w.requestedAt,
            completedAt: w.completedAt,
            stripePayoutId: w.stripePayoutId,
        })),
    });
}

/**
 * GET /billing/v1/landowner/withdrawals/:withdrawalId
 * Get specific withdrawal details
 */
export async function getWithdrawalDetailsHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const withdrawalId = c.req.param('withdrawalId');

    const withdrawal = await db.withdrawalRequest.findUnique({
        where: { id: withdrawalId },
        include: { transactions: true },
    });

    if (!withdrawal) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Withdrawal not found',
            code: 'NOT_FOUND',
        });
    }

    if (withdrawal.landownerId !== cognitoUser.sub) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'You do not have access to this withdrawal',
            code: 'FORBIDDEN',
        });
    }

    return sendResponse(c, {
        message: 'Withdrawal details retrieved',
        data: {
            id: withdrawal.id,
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            status: withdrawal.status,
            requestedAt: withdrawal.requestedAt,
            processedAt: withdrawal.processedAt,
            completedAt: withdrawal.completedAt,
            stripePayoutId: withdrawal.stripePayoutId,
            failureReason: withdrawal.failureReason,
            transactions: withdrawal.transactions,
        },
    });
}

/**
 * POST /billing/v1/landowner/withdrawals/:withdrawalId/cancel
 * Cancel a pending withdrawal
 */
export async function cancelWithdrawalHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const withdrawalId = c.req.param('withdrawalId');

    const withdrawal = await db.withdrawalRequest.findUnique({
        where: { id: withdrawalId },
        include: { balance: true },
    });

    if (!withdrawal) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Withdrawal not found',
            code: 'NOT_FOUND',
        });
    }

    if (withdrawal.landownerId !== cognitoUser.sub) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'You do not have access to this withdrawal',
            code: 'FORBIDDEN',
        });
    }

    if (withdrawal.status !== 'PENDING') {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: `Cannot cancel withdrawal with status: ${withdrawal.status}`,
            code: 'INVALID_STATUS',
        });
    }

    try {
        // Cancel Stripe payout if exists
        if (withdrawal.stripePayoutId) {
            const profile = await db.landownerProfile.findUnique({
                where: { userId: cognitoUser.sub },
            });

            if (profile?.stripeAccountId) {
                await stripe.payouts.cancel(
                    withdrawal.stripePayoutId,
                    {},
                    { stripeAccount: profile.stripeAccountId }
                );
            }
        }

        // Restore balance
        const balance = withdrawal.balance;
        await db.landownerBalance.update({
            where: { id: balance.id },
            data: {
                availableBalance: Number(balance.availableBalance) + Number(withdrawal.amount),
                pendingBalance: Number(balance.pendingBalance) - Number(withdrawal.amount),
            },
        });

        // Update withdrawal status
        const updated = await db.withdrawalRequest.update({
            where: { id: withdrawalId },
            data: { status: 'CANCELLED' },
        });

        return sendResponse(c, {
            message: 'Withdrawal cancelled successfully',
            data: {
                id: updated.id,
                status: updated.status,
            },
        });
    } catch (err: any) {
        throw new AppError({
            statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
            message: `Failed to cancel withdrawal: ${err.message}`,
            code: 'CANCEL_ERROR',
        });
    }
}
