// microservices/payment-service/src/services/payments/withdrawals.service.ts
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    config,
    type CognitoUser,
} from '@vertiaccess/core';
import Stripe from 'stripe';

const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
});

export class WithdrawalsService {
    static async getWithdrawalInfo(cognitoUser: CognitoUser) {
        const user = await db.user.findUnique({
            where: { id: cognitoUser.sub },
            include: { assetOwnerProfile: true },
        });

        const stripeConnectId = user?.assetOwnerProfile?.stripeAccountId;

        const stats = {
            availableBalance: 0,
            pendingBalance: 0,
            totalWithdrawn: 0,
            isConnected: !!stripeConnectId,
        };

        if (stripeConnectId) {
            const balance = await stripe.balance.retrieve({
                stripeAccount: stripeConnectId,
            });
            stats.availableBalance = balance.available.reduce((acc: number, curr: any) => acc + curr.amount, 0) / 100;
            stats.pendingBalance = balance.pending.reduce((acc: number, curr: any) => acc + curr.amount, 0) / 100;
        }

        const withdrawals = await db.withdrawalRequest.findMany({
            where: { assetOwnerId: cognitoUser.sub },
            orderBy: { requestedAt: 'desc' },
        });

        stats.totalWithdrawn = withdrawals
            .filter((w: any) => w.status === 'COMPLETED')
            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

        return { stats, history: withdrawals };
    }
}
