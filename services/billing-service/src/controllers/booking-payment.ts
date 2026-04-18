// services/billing-service/src/controllers/booking-payment.ts
import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@serverless-backend-starter/database';
import {
    AppError,
    HTTPStatusCode,
    sendResponse,
    type CognitoUser,
} from '@serverless-backend-starter/core';
import { stripe } from '../services/billing.service.ts';
import { bookingPaymentSchema } from '../schemas/booking-payment.schema.ts';

/**
 * POST /billing/v1/booking-payment-intent
 * Creates a Stripe PaymentIntent for a PAYG per-booking fee.
 * Called when the operator has no active subscription.
 */
export async function createBookingPaymentIntentHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const body = (c.req as any).valid('json') as z.infer<typeof bookingPaymentSchema>;

    // Resolve or create the stripe customer for this user
    const user = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        include: { operatorProfile: true },
    });

    if (!user) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'User not found',
            code: 'NOT_FOUND',
        });
    }

    let stripeCustomerId = user.operatorProfile?.stripeCustomerId || null;

    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: cognitoUser.email,
            name: user.operatorProfile?.fullName || cognitoUser.email,
            metadata: { userId: user.id },
        });
        stripeCustomerId = customer.id;

        if (user.operatorProfile) {
            await db.operatorProfile.update({
                where: { userId: user.id },
                data: { stripeCustomerId },
            });
        }
    }

    // Create the PaymentIntent
    const amountInPence = Math.round(body.amount * 100);
    const intent = await stripe.paymentIntents.create({
        amount: amountInPence,
        currency: (body.currency || 'gbp').toLowerCase(),
        customer: stripeCustomerId,
        description: `Site booking fee for ${body.siteId}`,
        metadata: {
            userId: user.id,
            siteId: body.siteId,
            type: 'booking_fee',
        },
        automatic_payment_methods: { enabled: true },
    });

    return sendResponse(c, {
        message: 'PaymentIntent created',
        data: {
            clientSecret: intent.client_secret,
            paymentIntentId: intent.id,
            amount: body.amount,
            currency: body.currency || 'GBP',
        },
    });
}

/**
 * POST /billing/v1/bookings/:bookingId/pay
 * Processes a post-approval payment for a booking using the operator's default payment method.
 */
export async function payBookingHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const bookingId = c.req.param('bookingId');

    const operator = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        include: {
            operatorProfile: true,
            subscription: { include: { plan: true } },
            paymentMethods: {
                where: { isDefault: true },
                take: 1,
            },
        },
    });

    if (!operator) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Operator not found',
            code: 'NOT_FOUND',
        });
    }

    const defaultCard = operator.paymentMethods[0] ?? null;
    if (!defaultCard) {
        throw new AppError({
            statusCode: 402 as any,
            message: 'No default payment method found. Please add a card before paying.',
            code: 'PAYMENT_REQUIRED',
        });
    }

    const booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: {
            site: true,
        },
    });

    if (!booking) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Booking not found',
            code: 'NOT_FOUND',
        });
    }

    if (booking.operatorId !== cognitoUser.sub) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Access denied. You do not own this booking.',
            code: 'FORBIDDEN',
        });
    }

    if (booking.status !== 'APPROVED') {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: `Booking is currently ${booking.status}. Only APPROVED bookings can be paid.`,
            code: 'BAD_REQUEST',
        });
    }

    if (booking.paymentStatus === 'charged') {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Booking has already been paid.',
            code: 'BAD_REQUEST',
        });
    }

    const toalCost = booking.toalCost ? Number(booking.toalCost.toString()) : 0;
    const platformFee = booking.platformFee ? Number(booking.platformFee.toString()) : 0;

    // The user might have a subscription or it's PAYG.
    // If we're paying post-approval, we're likely charging the full outstanding amount.
    // However, if platformFee was already paid upfront, we'd theoretically only charge toalCost.
    // We assume if paymentStatus is 'pending', the full cost wasn't paid yet.
    const totalToChange = toalCost + platformFee;

    if (totalToChange <= 0) {
        // If cost is 0, just mark it as paid.
        await db.booking.update({
            where: { id: bookingId },
            data: { paymentStatus: 'charged' },
        });
        return sendResponse(c, { message: 'Booking marked as paid (No charge)' });
    }

    let stripeCustomerId = operator.operatorProfile?.stripeCustomerId;
    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: cognitoUser.email,
            name: operator.operatorProfile?.fullName || cognitoUser.email,
            metadata: { userId: operator.id },
        });
        stripeCustomerId = customer.id;
        if (operator.operatorProfile) {
            await db.operatorProfile.update({
                where: { userId: operator.id },
                data: { stripeCustomerId },
            });
        }
    }

    const amountInPence = Math.round(totalToChange * 100);
    let intent;
    try {
        intent = await stripe.paymentIntents.create({
            amount: amountInPence,
            currency: 'gbp',
            customer: stripeCustomerId,
            payment_method: defaultCard.stripePaymentMethodId,
            off_session: true,
            confirm: true,
            description: `Payment for booking ${booking.bookingReference}`,
            metadata: {
                userId: operator.id,
                bookingId: booking.id,
                type: 'landowner_payment',
            },
        });
    } catch (err: any) {
        throw new AppError({
            statusCode: 402 as any,
            message: `Payment failed: ${err.message}`,
            code: 'PAYMENT_FAILED',
        });
    }

    if (intent.status !== 'succeeded') {
        throw new AppError({
            statusCode: 402 as any,
            message: `Payment not confirmed. Stripe status: ${intent.status}`,
            code: 'PAYMENT_NOT_CONFIRMED',
        });
    }

    // Mark booking as charged
    await db.$transaction(async (tx) => {
        await tx.booking.update({
            where: { id: bookingId },
            data: {
                paymentStatus: 'charged',
                paymentMethodLast4: defaultCard.last4,
                paymentMethodBrand: defaultCard.brand,
            },
        });

        await tx.transaction.create({
            data: {
                userId: operator.id,
                bookingId: booking.id,
                amount: totalToChange,
                currency: 'GBP',
                transactionType: 'PAYG_BOOKING',
                status: 'charged',
                stripeChargeId: intent.latest_charge as string | undefined,
                pricingBreakdown: {
                    toalCost,
                    platformFee,
                },
            },
        });
    });

    return sendResponse(c, {
        message: 'Payment processed successfully',
        data: { paymentStatus: 'charged' },
    });
}
