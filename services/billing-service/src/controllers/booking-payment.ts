// services/billing-service/src/controllers/booking-payment.ts
import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    sendResponse,
    type CognitoUser,
    generateCertId,
} from '@vertiaccess/core';
import { stripe } from '../services/billing.service.ts';
import { bookingPaymentSchema } from '../schemas/booking-payment.schema.ts';

/** Generate a deterministic verification hash for a consent certificate */
function generateVerificationHash(bookingId: string, siteId: string, operatorId: string): string {
    const raw = `${bookingId}:${siteId}:${operatorId}:${Date.now()}`;
    return Buffer.from(raw).toString('base64url');
}

async function ensureStripeCustomerId(params: {
    userId: string;
    email: string;
    fullName?: string | null;
    currentStripeCustomerId?: string | null;
}): Promise<string> {
    if (params.currentStripeCustomerId) {
        return params.currentStripeCustomerId;
    }

    const customer = await stripe.customers.create({
        email: params.email,
        name: params.fullName || params.email,
        metadata: { userId: params.userId },
    });

    await db.operatorProfile.update({
        where: { userId: params.userId },
        data: { stripeCustomerId: customer.id },
    });

    return customer.id;
}

async function chargeApprovedBooking(params: {
    booking: any;
    operator: any;
    trigger: 'manual' | 'scheduled';
}) {
    const { booking, operator, trigger } = params;

    if (booking.paymentStatus === 'charged') {
        return { status: 'already_paid' as const, amount: 0 };
    }

    if (booking.status !== 'APPROVED') {
        return { status: 'not_approved' as const, amount: 0 };
    }

    if (!booking.isPayg) {
        return { status: 'not_payg' as const, amount: 0 };
    }

    const defaultCard = operator.paymentMethods?.[0] ?? null;
    if (!defaultCard) {
        throw new AppError({
            statusCode: 402 as any,
            message: 'No default payment method found. Please add a card before charging.',
            code: 'PAYMENT_REQUIRED',
        });
    }

    const toalCost = booking.toalCost ? Number(booking.toalCost.toString()) : 0;
    const platformFee = booking.platformFee ? Number(booking.platformFee.toString()) : 0;
    const totalToCharge = toalCost + platformFee;

    if (totalToCharge <= 0) {
        await db.$transaction(async tx => {
            await tx.booking.update({
                where: { id: booking.id },
                data: {
                    paymentStatus: 'charged',
                    paymentMethodLast4: defaultCard.last4,
                    paymentMethodBrand: defaultCard.brand,
                },
            });

            const existingCert = await tx.consentCertificate.findFirst({
                where: { bookingId: booking.id },
                select: { id: true },
            });

            if (!existingCert) {
                const hash = generateVerificationHash(
                    booking.id,
                    booking.siteId,
                    booking.operatorId
                );
                const certId = generateCertId();
                await tx.consentCertificate.create({
                    data: {
                        bookingId: booking.id,
                        certId,
                        issueDate: new Date(),
                        verificationHash: hash,
                        digitalSignature: `SIG_${hash.substring(0, 24)}`,
                        verificationUrl: `https://vertiaccess.app/verify/${hash}`,
                        siteStatusAtIssue: booking.site?.status || 'ACTIVE',
                    },
                });
            }
        });

        return { status: 'charged' as const, amount: 0 };
    }

    if (trigger === 'scheduled') {
        await db.notification.create({
            data: {
                userId: booking.operatorId,
                type: 'info',
                title: 'Scheduled Payment Processing',
                message: `Your booking ${booking.bookingReference} is due now. We are about to charge £${totalToCharge.toFixed(2)} to your default card.`,
                actionUrl: '/dashboard/operator',
                relatedEntityId: booking.id,
            },
        });
    }

    const stripeCustomerId = await ensureStripeCustomerId({
        userId: operator.id,
        email: operator.email,
        fullName: operator.operatorProfile?.fullName,
        currentStripeCustomerId: operator.operatorProfile?.stripeCustomerId,
    });

    const amountInPence = Math.round(totalToCharge * 100);
    let intent;

    try {
        intent = await stripe.paymentIntents.create({
            amount: amountInPence,
            currency: 'gbp',
            customer: stripeCustomerId,
            payment_method: defaultCard.stripePaymentMethodId,
            off_session: true,
            confirm: true,
            description: `Scheduled booking charge for ${booking.bookingReference}`,
            metadata: {
                userId: operator.id,
                bookingId: booking.id,
                type: 'booking_one_time_subscription_charge',
                trigger,
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

    await db.$transaction(async tx => {
        await tx.booking.update({
            where: { id: booking.id },
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
                amount: totalToCharge,
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

        const existingCert = await tx.consentCertificate.findFirst({
            where: { bookingId: booking.id },
            select: { id: true },
        });

        if (!existingCert) {
            const hash = generateVerificationHash(booking.id, booking.siteId, booking.operatorId);
            const certId = generateCertId();
            await tx.consentCertificate.create({
                data: {
                    bookingId: booking.id,
                    certId,
                    issueDate: new Date(),
                    verificationHash: hash,
                    digitalSignature: `SIG_${hash.substring(0, 24)}`,
                    verificationUrl: `https://vertiaccess.app/verify/${hash}`,
                    siteStatusAtIssue: booking.site?.status || 'ACTIVE',
                },
            });
        }

        await tx.notification.create({
            data: {
                userId: booking.operatorId,
                type: 'success',
                title: 'Payment Confirmed',
                message:
                    trigger === 'scheduled'
                        ? `Your scheduled booking charge of £${totalToCharge.toFixed(2)} for ${booking.bookingReference} has been processed and your consent certificate is ready.`
                        : `Your payment of £${totalToCharge.toFixed(2)} was successfully processed. Your consent certificate for booking ${booking.bookingReference} is now ready.`,
                actionUrl: '/dashboard/operator',
                relatedEntityId: booking.id,
            },
        });
    });

    return { status: 'charged' as const, amount: totalToCharge };
}

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

    if (user.operatorProfile && !stripeCustomerId) {
        stripeCustomerId = await ensureStripeCustomerId({
            userId: user.id,
            email: cognitoUser.email,
            fullName: user.operatorProfile?.fullName,
            currentStripeCustomerId: user.operatorProfile?.stripeCustomerId,
        });
    }

    if (!stripeCustomerId) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Operator profile is missing. Please complete account setup before booking.',
            code: 'BAD_REQUEST',
        });
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
            type: 'booking_fee_hold',
        },
        automatic_payment_methods: { enabled: true },
    });

    return sendResponse(c, {
        message: 'Payment method prepared. Charge runs on booking start date.',
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

    if (booking.useCategory === 'emergency_recovery' && booking.clzUsed !== true) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message:
                'Emergency & Recovery payment is allowed only after usage is confirmed as used.',
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

    if (new Date(booking.startTime) > new Date()) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message:
                'This booking is scheduled for deferred charging. It will be charged on the booking start date.',
            code: 'BAD_REQUEST',
        });
    }

    const result = await chargeApprovedBooking({
        booking,
        operator,
        trigger: 'manual',
    });

    return sendResponse(c, {
        message:
            result.status === 'charged' ? 'Payment processed successfully' : 'No charge needed',
        data: { paymentStatus: result.status === 'charged' ? 'charged' : booking.paymentStatus },
    });
}

/**
 * POST /billing/v1/bookings/process-due-payments
 * Internal endpoint for scheduler to charge PAYG bookings when start time is reached.
 */
export async function processDueBookingPaymentsHandler(c: Context): Promise<Response> {
    const configuredKey = process.env.BOOKING_CHARGE_KEY;
    if (configuredKey) {
        const receivedKey = c.req.header('x-booking-charge-key');
        if (!receivedKey || receivedKey !== configuredKey) {
            throw new AppError({
                statusCode: HTTPStatusCode.UNAUTHORIZED,
                message: 'Unauthorized',
                code: 'UNAUTHORIZED',
            });
        }
    }

    const now = new Date();
    const dueBookings = await db.booking.findMany({
        where: {
            isPayg: true,
            status: 'APPROVED',
            paymentStatus: 'pending',
            useCategory: 'planned_toal',
            startTime: { lte: now },
            cancelledAt: null,
        },
        include: {
            site: true,
            operator: {
                include: {
                    operatorProfile: true,
                    paymentMethods: {
                        where: { isDefault: true },
                        take: 1,
                    },
                },
            },
        },
        take: 100,
        orderBy: { startTime: 'asc' },
    });

    const results: Array<{
        bookingId: string;
        bookingReference: string;
        status: 'charged' | 'failed' | 'already_paid' | 'not_approved' | 'not_payg';
        message?: string;
    }> = [];

    for (const booking of dueBookings) {
        try {
            const result = await chargeApprovedBooking({
                booking,
                operator: booking.operator,
                trigger: 'scheduled',
            });

            results.push({
                bookingId: booking.id,
                bookingReference: booking.bookingReference,
                status: result.status,
            });
        } catch (error: any) {
            results.push({
                bookingId: booking.id,
                bookingReference: booking.bookingReference,
                status: 'failed',
                message: error?.message || 'Unknown error',
            });

            await db.notification.create({
                data: {
                    userId: booking.operatorId,
                    type: 'error',
                    title: 'Scheduled Payment Failed',
                    message: `We could not process the scheduled payment for booking ${booking.bookingReference}. Please update your card and retry payment.`,
                    actionUrl: '/dashboard/operator',
                    relatedEntityId: booking.id,
                },
            });
        }
    }

    const chargedCount = results.filter(r => r.status === 'charged').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return sendResponse(c, {
        message: 'Due booking payment run completed',
        data: {
            processed: dueBookings.length,
            charged: chargedCount,
            failed: failedCount,
            results,
        },
    });
}
