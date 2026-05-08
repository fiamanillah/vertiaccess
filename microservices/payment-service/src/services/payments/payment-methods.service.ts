// microservices/payment-service/src/services/payments/payment-methods.service.ts
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

export class PaymentMethodsService {
    static async listPaymentMethods(cognitoUser: CognitoUser) {
        return db.paymentMethod.findMany({
            where: { userId: cognitoUser.sub },
            orderBy: { addedAt: 'desc' },
        });
    }

    static async savePaymentMethod(cognitoUser: CognitoUser, body: { paymentMethodId: string; isDefault?: boolean }) {
        const { paymentMethodId, isDefault } = body;

        let user = await db.user.findUnique({
            where: { id: cognitoUser.sub },
            include: { operatorProfile: true, landownerProfile: true },
        });

        let stripeCustomerId = user?.operatorProfile?.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user?.email || cognitoUser.email,
                metadata: { userId: cognitoUser.sub },
            });
            stripeCustomerId = customer.id;
            await db.operatorProfile.update({
                where: { userId: cognitoUser.sub },
                data: { stripeCustomerId: customer.id },
            });
        }

        const stripeMethod = await stripe.paymentMethods.attach(paymentMethodId, {
            customer: stripeCustomerId,
        });

        if (isDefault) {
            await stripe.customers.update(stripeCustomerId, {
                invoice_settings: { default_payment_method: paymentMethodId },
            });
            await db.paymentMethod.updateMany({
                where: { userId: cognitoUser.sub },
                data: { isDefault: false },
            });
        }

        return db.paymentMethod.create({
            data: {
                userId: cognitoUser.sub,
                stripePaymentMethodId: paymentMethodId,
                brand: stripeMethod.card?.brand || 'unknown',
                last4: stripeMethod.card?.last4 || '****',
                expiryMonth: String(stripeMethod.card?.exp_month || '00'),
                expiryYear: String(stripeMethod.card?.exp_year || '0000'),
                isDefault: isDefault || false,
            },
        });
    }

    static async deletePaymentMethod(cognitoUser: CognitoUser, methodId: string) {
        const method = await db.paymentMethod.findUnique({
            where: { id: methodId },
        });

        if (!method || method.userId !== cognitoUser.sub) {
            throw new AppError({
                statusCode: HTTPStatusCode.NOT_FOUND,
                message: 'Payment method not found',
                code: 'NOT_FOUND',
            });
        }

        await stripe.paymentMethods.detach(method.stripePaymentMethodId);
        await db.paymentMethod.delete({ where: { id: methodId } });
    }
}
