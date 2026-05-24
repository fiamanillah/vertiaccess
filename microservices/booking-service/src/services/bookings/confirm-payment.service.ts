import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode } from '@vertiaccess/core'
import { issueBookingCertificate } from './create-booking.service'
import { ensureStripeCustomerId } from '../internal-payment-client'
import { getStripeClient } from '../internal-payment-client'

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

  if (booking.status === 'APPROVED' && booking.paymentStatus === 'charged') {
    return booking // Already confirmed
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

  // Double check that the payment intent actually belongs to this booking
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

  // Update booking to APPROVED and create certificate
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

    await issueBookingCertificate(
      tx as any,
      booking.id,
      booking.siteId,
      booking.operatorId,
      booking.bookingReference,
      booking.site.status,
    )

    await tx.notification.create({
      data: {
        userId: booking.operatorId,
        type: 'success',
        title: 'Booking Confirmed',
        message: `Your booking for "${booking.site.name}" (${booking.bookingReference}) has been approved and payment was processed successfully. Your certificate is now available.`,
        actionUrl: '/dashboard/operator',
        relatedEntityId: booking.id,
      },
    })
  })

  const approvedBooking = await db.booking.findUnique({
    where: { id: booking.id },
    include: {
      operator: {
        include: { operatorProfile: true },
      },
      site: {
        include: {
          organization: { include: { notificationSettings: true } },
        },
      },
    },
  })

  return approvedBooking
}
