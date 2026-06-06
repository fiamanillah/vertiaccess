import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode, recordBookingLifecycleEvent } from '@vertiaccess/core'
import { getStripeClient } from '../internal-payment-client'
import { bookingInclude } from './utils'

export async function confirmBookingPayment(bookingId: string, operatorId: string, paymentIntentId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      site: true,
      operator: {
        include: { operatorProfile: true },
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

  if (booking.operatorId !== operatorId) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Not authorized to confirm this booking',
      code: 'FORBIDDEN',
    })
  }

  // --- Idempotency Guard ---
  // If the webhook or a previous call already charged the booking, return early
  // without creating duplicate Transaction or Certificate records.
  if (booking.paymentStatus === 'charged') {
    const existing = await db.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    })
    return existing
  }

  const stripe = getStripeClient()
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (!intent) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Payment intent not found',
      code: 'PAYMENT_NOT_FOUND',
    })
  }

  // Verify the payment intent actually belongs to this booking
  if (intent.metadata?.bookingId !== booking.id) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Payment intent does not match booking',
      code: 'PAYMENT_MISMATCH',
    })
  }

  if (intent.status !== 'succeeded') {
    throw new AppError({
      statusCode: HTTPStatusCode.PAYMENT_REQUIRED,
      message: `Payment not confirmed. Stripe status: ${intent.status}`,
      code: 'PAYMENT_NOT_CONFIRMED',
    })
  }

  const toalCost = Number(booking.toalCost || 0)
  const platformFee = Number(booking.platformFee || 0)

  await db.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: 'APPROVED',
        paymentStatus: 'charged' as any,
        respondedAt: new Date(),
      },
    })

    // Record PAYMENT_CONFIRMED lifecycle event (3DS success path)
    await recordBookingLifecycleEvent(tx as any, {
      bookingId: booking.id,
      eventType: 'PAYMENT_CONFIRMED',
      actorType: 'system',
      actorId: 'stripe',
      previousState: {
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
      newState: {
        status: 'APPROVED',
        paymentStatus: 'charged',
      },
      metadata: {
        bookingReference: booking.bookingReference,
        amount: toalCost + platformFee,
        trigger: '3ds_confirm',
        paymentIntentId,
      },
    })

    // Record BOOKING_APPROVED lifecycle event
    await recordBookingLifecycleEvent(tx as any, {
      bookingId: booking.id,
      eventType: 'BOOKING_APPROVED',
      actorType: 'system',
      actorId: 'system',
      previousState: { status: booking.status },
      newState: { status: 'APPROVED' },
      metadata: {
        bookingReference: booking.bookingReference,
        trigger: '3ds_payment_success',
      },
    })

    // Guard against duplicate Transaction records (webhook may have already created one)
    const existingTransaction = await tx.transaction.findFirst({
      where: { bookingId: booking.id },
      select: { id: true },
    })

    if (!existingTransaction) {
      await tx.transaction.create({
        data: {
          userId: booking.operatorId,
          bookingId: booking.id,
          amount: toalCost + platformFee,
          currency: 'GBP',
          transactionType: 'PAYG_BOOKING',
          status: 'charged',
          stripeChargeId: intent.latest_charge as string | undefined,
          pricingBreakdown: { toalCost, platformFee },
        },
      })

      if (booking.site?.assetManagerId && toalCost > 0) {
        await tx.assetManagerBalance.upsert({
          where: { assetManagerId: booking.site.assetManagerId },
          update: { pendingBalance: { increment: toalCost } },
          create: {
            assetManagerId: booking.site.assetManagerId,
            pendingBalance: toalCost,
            availableBalance: 0,
          },
        })
      }
    }

    await tx.notification.create({
      data: {
        userId: booking.operatorId,
        type: 'success',
        title: 'Booking Confirmed',
        message: `Your booking for "${booking.site.name}" (${booking.bookingReference}) has been approved and payment was processed successfully.`,
        actionUrl: '/dashboard/operator',
        relatedEntityId: booking.id,
      },
    })
  })

  const approvedBooking = await db.booking.findUnique({
    where: { id: booking.id },
    include: bookingInclude,
  })

  return approvedBooking
}
