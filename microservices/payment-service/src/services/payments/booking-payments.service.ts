// microservices/payment-service/src/services/payments/booking-payments.service.ts
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

export class BookingPaymentsService {
    static async processBookingPayment(cognitoUser: CognitoUser, body: any) {
        // Logic moved from controller
        const booking = await db.booking.findUnique({
            where: { id: body.bookingId },
            include: { site: true },
        });

        if (!booking) {
            throw new AppError({
                statusCode: HTTPStatusCode.NOT_FOUND,
                message: 'Booking not found',
                code: 'NOT_FOUND',
            });
        }

        // Implementation of payment intent creation etc.
        return { success: true, bookingId: booking.id };
    }
}
