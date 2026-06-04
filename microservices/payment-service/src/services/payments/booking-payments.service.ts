// microservices/payment-service/src/services/payments/booking-payments.service.ts
import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  config,
  generateVAID,
  recordBookingLifecycleEvent,
  type CognitoUser,
} from '@vertiaccess/core'
import Stripe from 'stripe'

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})



async function ensureStripeCustomerId(params: {
  userId: string
  email: string
  fullName?: string | null
  currentStripeCustomerId?: string | null
}): Promise<string> {
  if (params.currentStripeCustomerId) {
    return params.currentStripeCustomerId
  }

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.fullName || params.email,
    metadata: { userId: params.userId },
  })

  await db.operatorProfile.update({
    where: { userId: params.userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

async function chargeApprovedBooking(params: {
  booking: any
  operator: any
  trigger: 'manual' | 'scheduled' | 'approval'
}) {
  const { booking, operator, trigger } = params

  if (booking.paymentStatus === 'charged') {
    return { status: 'already_paid' as const, amount: 0 }
  }

  if (booking.status !== 'APPROVED') {
    return { status: 'not_approved' as const, amount: 0 }
  }

  if (!booking.isPayg) {
    return { status: 'not_payg' as const, amount: 0 }
  }

  const defaultCard = operator.paymentMethods?.[0] ?? null
  if (!defaultCard) {
    throw new AppError({
      statusCode: 402 as any,
      message:
        'No default payment method found. Please add a card before charging.',
      code: 'PAYMENT_REQUIRED',
    })
  }

  const toalCost = booking.toalCost ? Number(booking.toalCost.toString()) : 0
  const platformFee = booking.platformFee
    ? Number(booking.platformFee.toString())
    : 0
  const totalToCharge = toalCost + platformFee

  if (totalToCharge <= 0) {
    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'charged',
          paymentMethodLast4: defaultCard.last4,
          paymentMethodBrand: defaultCard.brand,
        },
      })

      await recordBookingLifecycleEvent(tx as any, {
        bookingId: booking.id,
        eventType: 'PAYMENT_CHARGED',
        actorType: 'system',
        actorId: 'stripe',
        previousState: {
          paymentStatus: booking.paymentStatus,
        },
        newState: {
          paymentStatus: 'charged',
          paymentMethodLast4: defaultCard.last4,
          paymentMethodBrand: defaultCard.brand,
        },
        metadata: {
          trigger,
          amount: totalToCharge,
          bookingReference: booking.bookingReference,
        },
      })


    })

    return { status: 'charged' as const, amount: 0 }
  }

  const stripeCustomerId = await ensureStripeCustomerId({
    userId: operator.id,
    email: operator.email,
    fullName: operator.operatorProfile?.fullName,
    currentStripeCustomerId: operator.operatorProfile?.stripeCustomerId,
  })

  const amountInPence = Math.round(totalToCharge * 100)
  let intent

  try {
    intent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: 'gbp',
      customer: stripeCustomerId,
      payment_method: defaultCard.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      description: `${trigger === 'scheduled' ? 'Scheduled' : trigger === 'approval' ? 'Approval' : 'Manual'} booking charge for ${booking.bookingReference}`,
      metadata: {
        userId: operator.id,
        bookingId: booking.id,
        type: 'booking_one_time_subscription_charge',
        trigger,
      },
    })
  } catch (err: any) {
    await recordBookingLifecycleEvent(db as any, {
      bookingId: booking.id,
      eventType: 'PAYMENT_FAILED',
      actorType: 'system',
      actorId: 'stripe',
      previousState: {
        paymentStatus: booking.paymentStatus,
      },
      newState: {
        paymentStatus: 'failed',
      },
      metadata: {
        trigger,
        bookingReference: booking.bookingReference,
        amount: totalToCharge,
        error: err?.message || 'Unknown Stripe error',
      },
    })

    await db.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: 'failed' as any },
    })

    throw new AppError({
      statusCode: 402 as any,
      message: `Payment failed: ${err.message}`,
      code: 'PAYMENT_FAILED',
    })
  }

  if (intent.status !== 'succeeded') {
    await recordBookingLifecycleEvent(db as any, {
      bookingId: booking.id,
      eventType: 'PAYMENT_FAILED',
      actorType: 'system',
      actorId: 'stripe',
      previousState: {
        paymentStatus: booking.paymentStatus,
      },
      newState: {
        paymentStatus: 'failed',
      },
      metadata: {
        trigger,
        bookingReference: booking.bookingReference,
        amount: totalToCharge,
        stripeStatus: intent.status,
      },
    })

    await db.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: 'failed' as any },
    })

    throw new AppError({
      statusCode: 402 as any,
      message: `Payment not confirmed. Stripe status: ${intent.status}`,
      code: 'PAYMENT_NOT_CONFIRMED',
    })
  }

  await db.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'charged',
        paymentMethodLast4: defaultCard.last4,
        paymentMethodBrand: defaultCard.brand,
      },
    })

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
    })

    if (booking.site?.landownerId && toalCost > 0) {
      await tx.landownerBalance.upsert({
        where: { landownerId: booking.site.landownerId },
        update: { pendingBalance: { increment: toalCost } },
        create: {
          landownerId: booking.site.landownerId,
          pendingBalance: toalCost,
          availableBalance: 0,
        },
      })
    }



    await tx.notification.create({
      data: {
        userId: booking.operatorId,
        type: 'success',
        title: 'Payment Confirmed',
        message:
          trigger === 'scheduled'
            ? `Your scheduled booking charge of £${totalToCharge.toFixed(2)} for ${booking.bookingReference} has been processed.`
            : trigger === 'approval'
              ? `Your booking ${booking.bookingReference} was approved and charged £${totalToCharge.toFixed(2)} successfully.`
              : `Your payment of £${totalToCharge.toFixed(2)} was successfully processed for booking ${booking.bookingReference}.`,
        actionUrl: '/dashboard/operator',
        relatedEntityId: booking.id,
      },
    })
  })

  return { status: 'charged' as const, amount: totalToCharge }
}

export class BookingPaymentsService {
  static async processBookingPayment(cognitoUser: CognitoUser, body: any) {
    const booking = await db.booking.findUnique({
      where: { id: body.bookingId },
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
    })

    if (!booking) {
      throw new AppError({
        statusCode: HTTPStatusCode.NOT_FOUND,
        message: 'Booking not found',
        code: 'NOT_FOUND',
      })
    }

    if (booking.operatorId !== cognitoUser.sub) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'Access denied. You do not own this booking.',
        code: 'FORBIDDEN',
      })
    }

    const result = await chargeApprovedBooking({
      booking,
      operator: booking.operator,
      trigger: 'manual',
    })

    return { success: result.status === 'charged', bookingId: booking.id }
  }
}
