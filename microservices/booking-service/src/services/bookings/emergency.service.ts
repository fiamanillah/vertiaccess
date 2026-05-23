import type { CognitoUser } from '@vertiaccess/core'
import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  recordBookingLifecycleEvent,
} from '@vertiaccess/core'
import { bookingInclude } from './utils'

export async function confirmEmergencyUsage(
  cognitoUser: CognitoUser,
  bookingId: string,
  body: any,
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
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
      message: 'You can only confirm usage for your own booking',
      code: 'FORBIDDEN',
    })
  }

  if (booking.useCategory !== 'emergency_recovery') {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message:
        'Usage confirmation is only available for Emergency & Recovery bookings',
      code: 'BAD_REQUEST',
    })
  }

  if (booking.status !== 'APPROVED') {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Only approved bookings can be usage-confirmed',
      code: 'BAD_REQUEST',
    })
  }

  if (new Date(booking.endTime) > new Date()) {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Usage can only be confirmed after the operation window ends',
      code: 'BAD_REQUEST',
    })
  }

  if (booking.clzConfirmedAt) {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Emergency usage has already been confirmed for this booking',
      code: 'BAD_REQUEST',
    })
  }

  const newPaymentStatus = body.used ? 'pending_charge' : 'cancelled_no_charge'

  const updated = await db.$transaction(async (tx) => {
    const previousState = {
      clzUsed: booking.clzUsed,
      clzConfirmedAt: booking.clzConfirmedAt,
      paymentStatus: booking.paymentStatus,
    }

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        clzUsed: body.used,
        clzConfirmedAt: new Date(),
        paymentStatus: newPaymentStatus as any,
      },
      include: bookingInclude,
    })

    await recordBookingLifecycleEvent(tx as any, {
      bookingId,
      eventType: body.used ? 'EMERGENCY_USAGE_CONFIRMED' : 'EMERGENCY_NOT_USED',
      actorType: 'operator',
      actorId: cognitoUser.sub,
      previousState,
      newState: {
        clzUsed: body.used,
        clzConfirmedAt: updatedBooking.clzConfirmedAt,
        paymentStatus: newPaymentStatus,
      },
      metadata: {
        bookingReference: booking.bookingReference,
        siteName: booking.site?.name,
      },
    })
    if (body.used) {
      await tx.notification.create({
        data: {
          userId: booking.operatorId,
          type: 'info',
          title: 'Emergency Landing Confirmed',
          message: `You confirmed use of "${booking.site?.name}" for booking ${booking.bookingReference}. We are processing the payment now.`,
          actionUrl: '/dashboard/operator',
          relatedEntityId: bookingId,
        },
      })

      await tx.notification.create({
        data: {
          userId: booking.site?.landownerId,
          type: 'info',
          title: 'Emergency Landing Confirmed — Payment Processing',
          message: `The operator confirmed an emergency landing at "${booking.site?.name}" (${booking.bookingReference}). Payment is processing and will be reflected in your balance shortly.`,
          actionUrl: '/dashboard/landowner',
          relatedEntityId: bookingId,
        },
      })
    } else {
      await tx.notification.create({
        data: {
          userId: booking.operatorId,
          type: 'success',
          title: 'No Charge Applied',
          message: `You confirmed the emergency site "${booking.site?.name}" was not used. No charge has been applied to your card.`,
          actionUrl: '/dashboard/operator',
          relatedEntityId: bookingId,
        },
      })

      await tx.notification.create({
        data: {
          userId: booking.site?.landownerId,
          type: 'info',
          title: 'Emergency Landing Not Used',
          message: `The operator confirmed the emergency landing site "${booking.site?.name}" (${booking.bookingReference}) was not used. No payout will be issued.`,
          actionUrl: '/dashboard/landowner',
          relatedEntityId: bookingId,
        },
      })
    }

    return updatedBooking
  })

  // fire-and-forget: trigger off-session charge via internal endpoint
  if (body.used) {
    const paymentServiceUrl = process.env.PAYMENT_SERVICE_INTERNAL_URL
    const chargeKey = process.env.BOOKING_CHARGE_KEY
    if (paymentServiceUrl && chargeKey) {
      fetch(
        `${paymentServiceUrl}/billing/v1/bookings/${bookingId}/charge-emergency`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-booking-charge-key': chargeKey,
          },
          body: JSON.stringify({ trigger: 'operator_confirmed' }),
        },
      ).catch((err) => {
        console.error(
          `[confirmEmergencyUsage] Failed to call charge endpoint: ${err.message}`,
        )
      })
    }
  }

  return updated
}
