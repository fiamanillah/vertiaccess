import { AppError, HTTPStatusCode } from '@vertiaccess/core';

type StripeErrorLike = {
    type?: string;
    code?: string;
    param?: string;
    message?: string;
};

function asStripeErrorLike(error: unknown): StripeErrorLike {
    if (!error || typeof error !== 'object') {
        return {};
    }

    return error as StripeErrorLike;
}

function isPaymentMethodMissing(error: unknown): boolean {
    const stripeError = asStripeErrorLike(error);
    const message = stripeError.message || (error instanceof Error ? error.message : '');

    const missingByCode =
        stripeError.code === 'resource_missing' && stripeError.param === 'payment_method';

    const missingByMessage = message.includes('No such PaymentMethod');

    return missingByCode || missingByMessage;
}

export function toStripeAppError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error;
    }

    if (isPaymentMethodMissing(error)) {
        return new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message:
                'Payment method was not found in this Stripe account. Please re-add your card and retry.',
            code: 'PAYMENT_METHOD_NOT_FOUND',
            details: {
                originalError: error instanceof Error ? error.message : String(error),
            },
        });
    }

    return new AppError({
        statusCode: HTTPStatusCode.BAD_GATEWAY,
        message: error instanceof Error ? error.message : 'Stripe request failed',
        code: 'STRIPE_REQUEST_FAILED',
        details: {
            originalError: error instanceof Error ? error.message : String(error),
        },
    });
}
