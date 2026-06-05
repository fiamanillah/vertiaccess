import type { CognitoUser } from '@vertiaccess/core'
import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  generateVAID,
  recordBookingLifecycleEvent,
} from '@vertiaccess/core'
import { bookingInclude } from './utils'
import { chargeApprovedBooking } from '../internal-payment-client'

async function triggerApprovedBookingCharge(bookingId: string) {
  try {
    const result = await chargeApprovedBooking({
      bookingId,
      trigger: 'approval',
    })

    if (result.status !== 'charged' && result.status !== 'already_paid') {
      throw new AppError({
        statusCode: HTTPStatusCode.PAYMENT_REQUIRED,
        message: 'Payment failed. Please update your card and try again.',
        code: 'PAYMENT_FAILED',
      })
    }
  } catch (error) {
    console.error(
      `[updateBookingStatus] Failed to charge booking ${bookingId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )

    if (error instanceof AppError) throw error

    throw new AppError({
      statusCode: HTTPStatusCode.BAD_GATEWAY,
      message:
        'Payment service was unavailable. Please update your card and try again.',
      code: 'PAYMENT_FAILED',
    })
  }
}

export async function updateBookingStatus(
  cognitoUser: CognitoUser,
  bookingId: string,
  body: any,
) {
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      site: {
        select: {
          id: true,
          name: true,
          landownerId: true,
          toalAccessFee: true,
          cancellationFeePercentage: true,
          status: true,
        },
      },
      operator: {
        select: {
          email: true,
          operatorProfile: {
            select: { fullName: true, organisation: true },
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

  const isLandowner = booking.site?.landownerId === cognitoUser.sub
  const isOperator = booking.operatorId === cognitoUser.sub

  if (body.status === 'CANCELLED') {
    if (!isOperator && !isAdmin) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'Only the operator can cancel their own booking',
        code: 'FORBIDDEN',
      })
    }
  } else if (body.status === 'APPROVED' || body.status === 'REJECTED') {
    if (!isLandowner && !isAdmin) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'Only the landowner or admin can approve or reject bookings',
        code: 'FORBIDDEN',
      })
    }
  }

  if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: `Cannot update a ${booking.status} booking`,
      code: 'BAD_REQUEST',
    })
  }

  let cancellationFee: number | null = null
  let paymentStatus: string | null = null

  // ── Pre-approval payment-method guard ─────────────────────────────────────
  // For planned TOAL bookings with a non-zero TOAL cost, the operator MUST have
  // a default card on file before the landowner can approve. Check this BEFORE
  // touching the DB so the booking stays PENDING and the landowner gets a clear
  // error rather than seeing an approve→reject flip.
  if (
    body.status === 'APPROVED' &&
    booking.useCategory === 'planned_toal' &&
    Number(booking.toalCost ?? 0) > 0
  ) {
    const defaultCard = await db.paymentMethod.findFirst({
      where: { userId: booking.operatorId, isDefault: true },
      select: { id: true },
    })
    if (!defaultCard) {
      await db.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'failed' as any,
          },
        })

        await recordBookingLifecycleEvent(tx as any, {
          bookingId: booking.id,
          eventType: 'PAYMENT_FAILED',
          actorType: 'system',
          actorId: 'system',
          previousState: {
            status: 'PENDING',
            paymentStatus: booking.paymentStatus,
          },
          newState: {
            status: 'PENDING',
            paymentStatus: 'failed',
          },
          metadata: {
            bookingReference: booking.bookingReference,
            trigger: 'approval',
            error: 'Operator has no default payment method on file.',
            amountDue: Number(booking.toalCost ?? 0) + Number(booking.platformFee ?? 0),
          },
        })

        await tx.notification.create({
          data: {
            userId: booking.operatorId,
            type: 'error',
            title: 'Payment Method Required',
            message: `Your booking request (${booking.bookingReference}) for "${booking.site?.name}" cannot be approved because you have no default payment method on file. Please add a card.`,
            actionUrl: '/dashboard/operator/billing',
            relatedEntityId: booking.id,
          },
        })
      })

      throw new AppError({
        statusCode: HTTPStatusCode.PAYMENT_REQUIRED,
        message:
          'Cannot approve this booking: the operator has no default payment method on file. The operator must add a card before this booking can be approved.',
        code: 'APPROVAL_PAYMENT_FAILED',
      })
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  if (body.status === 'CANCELLED') {
    const feePercentage = booking.site?.cancellationFeePercentage
      ? Number(booking.site.cancellationFeePercentage.toString())
      : 0
    const baseCost = booking.toalCost ? Number(booking.toalCost.toString()) : 0
    const hoursUntilStart =
      (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60)

    if (
      booking.status === 'APPROVED' &&
      hoursUntilStart > 0 &&
      feePercentage > 0
    ) {
      cancellationFee = baseCost * (feePercentage / 100)
      paymentStatus = 'cancelled_partial'
    } else {
      paymentStatus = 'cancelled_no_charge'
    }
  }

  const updatedBooking = await db.$transaction(async (tx) => {
    const previousState = {
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      respondedAt: booking.respondedAt,
      cancelledAt: booking.cancelledAt,
    }

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: body.status as any,
        respondedAt:
          body.status === 'APPROVED' || body.status === 'REJECTED'
            ? new Date()
            : undefined,
        cancelledAt: body.status === 'CANCELLED' ? new Date() : undefined,
        cancellationFee: cancellationFee ?? undefined,
        paymentStatus: (paymentStatus as any) ?? undefined,
      },
      include: {
        site: {
          select: {
            name: true,
            address: true,
            landownerId: true,
            status: true,
            id: true,
          },
        },
        operator: {
          select: {
            email: true,
            operatorProfile: {
              select: { fullName: true, organisation: true, flyerId: true },
            },
          },
        },
      },
    })

    const nextState = {
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      respondedAt: updated.respondedAt,
      cancelledAt: updated.cancelledAt,
    }

    if (body.status === 'APPROVED') {
      await recordBookingLifecycleEvent(tx as any, {
        bookingId,
        eventType: 'BOOKING_APPROVED',
        actorType: isAdmin ? 'admin' : 'landowner',
        actorId: cognitoUser.sub,
        previousState,
        newState: nextState,
        metadata: {
          bookingReference: booking.bookingReference,
        },
      })
    }

    if (body.status === 'REJECTED') {
      await recordBookingLifecycleEvent(tx as any, {
        bookingId,
        eventType: 'BOOKING_REJECTED',
        actorType: isAdmin ? 'admin' : 'landowner',
        actorId: cognitoUser.sub,
        previousState,
        newState: nextState,
        metadata: {
          bookingReference: booking.bookingReference,
          adminNote: body.adminNote || null,
        },
      })
    }

    // Charge on approval when this is a planned TOAL booking with a non-zero
    // TOAL amount (covers both PAYG and subscription operators who still owe per-booking fees).
    const shouldChargeImmediately =
      body.status === 'APPROVED' &&
      booking.useCategory === 'planned_toal' &&
      (booking.toalCost ? Number(booking.toalCost.toString()) > 0 : false)

    if (body.status === 'APPROVED' && !shouldChargeImmediately) {
      await tx.notification.create({
        data: {
          userId: booking.operatorId,
          type: 'success',
          title: 'Booking Approved',
          message: `Your booking (${booking.bookingReference}) for "${booking.site?.name}" has been approved.`,
          actionUrl: '/dashboard/operator',
          relatedEntityId: bookingId,
        },
      })
    }

    if (body.status === 'REJECTED') {
      await tx.notification.create({
        data: {
          userId: booking.operatorId,
          type: 'error',
          title: 'Booking Rejected',
          message: `Your booking (${booking.bookingReference}) for "${booking.site?.name}" was rejected.${body.adminNote ? ` Reason: ${body.adminNote}` : ''}`,
          actionUrl: '/dashboard/operator',
          relatedEntityId: bookingId,
        },
      })
    }

    if (body.status === 'CANCELLED') {
      await recordBookingLifecycleEvent(tx as any, {
        bookingId,
        eventType: 'BOOKING_CANCELLED',
        actorType: isAdmin ? 'admin' : 'operator',
        actorId: cognitoUser.sub,
        previousState,
        newState: nextState,
        metadata: {
          bookingReference: booking.bookingReference,
          cancellationFee,
          paymentStatus,
        },
      })

      await tx.notification.create({
        data: {
          userId: booking.site!.landownerId,
          type: 'info',
          title: 'Booking Cancelled',
          message: `Booking (${booking.bookingReference}) for "${booking.site?.name}" has been cancelled by the operator.`,
          actionUrl: '/dashboard/landowner',
          relatedEntityId: bookingId,
        },
      })
    }

    return updated
  })

  const finalBooking = await db.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  })

  if (!finalBooking) {
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Booking could not be loaded after status update',
      code: 'INTERNAL_ERROR',
    })
  }

  const shouldChargeOnApproval =
    body.status === 'APPROVED' &&
    finalBooking.useCategory === 'planned_toal' &&
    Number(finalBooking.toalCost ?? 0) > 0 &&
    finalBooking.paymentStatus !== 'charged' &&
    finalBooking.paymentStatus !== 'cancelled_no_charge' &&
    finalBooking.paymentStatus !== 'cancelled_partial'

  if (shouldChargeOnApproval) {
    try {
      await triggerApprovedBookingCharge(finalBooking.id)
    } catch (error) {
      await db.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: finalBooking.id },
          data: {
            status: 'PENDING' as any,
            paymentStatus: 'failed' as any,
            respondedAt: null,
          },
        })

        await recordBookingLifecycleEvent(tx as any, {
          bookingId: finalBooking.id,
          eventType: 'PAYMENT_FAILED',
          actorType: 'system',
          actorId: 'stripe',
          previousState: {
            status: 'PENDING',
            paymentStatus: finalBooking.paymentStatus,
          },
          newState: {
            status: 'PENDING',
            paymentStatus: 'failed',
          },
          metadata: {
            bookingReference: finalBooking.bookingReference,
            trigger: 'approval',
            error: error instanceof Error ? error.message : 'Unknown error',
            amountDue: Number(finalBooking.toalCost ?? 0) + Number(finalBooking.platformFee ?? 0),
          },
        })

        await tx.notification.create({
          data: {
            userId: booking.operatorId,
            type: 'error',
            title: 'Payment Failed',
            message: `Payment failed for your booking request (${booking.bookingReference}) for "${booking.site?.name}". Please update your card to resolve this issue.`,
            actionUrl: '/dashboard/operator/billing',
            relatedEntityId: finalBooking.id,
          },
        })

        await tx.notification.create({
          data: {
            userId: booking.site!.landownerId,
            type: 'warning',
            title: 'Booking Approval Payment Failed',
            message: `Failed to charge operator's card for booking (${booking.bookingReference}) on approval. The booking remains pending.`,
            actionUrl: `/dashboard/landowner/scheduler/${finalBooking.id}/review`,
            relatedEntityId: finalBooking.id,
          },
        })
      })

      throw new AppError({
        statusCode: HTTPStatusCode.PAYMENT_REQUIRED,
        message: error instanceof Error ? error.message : 'Payment charge failed',
        code: 'APPROVAL_PAYMENT_FAILED',
      })
    }

    await db.$transaction(async (tx) => {
      await tx.notification.create({
        data: {
          userId: booking.operatorId,
          type: 'success',
          title: 'Booking Confirmed',
          message: `Your booking (${booking.bookingReference}) for "${booking.site?.name}" has been approved and payment was processed successfully.`,
          actionUrl: '/dashboard/operator',
          relatedEntityId: finalBooking.id,
        },
      })
    })

    const approvedBooking = await db.booking.findUnique({
      where: { id: finalBooking.id },
      include: bookingInclude,
    })

    if (!approvedBooking) {
      throw new AppError({
        statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
        message: 'Booking could not be loaded after payment confirmation',
        code: 'INTERNAL_ERROR',
      })
    }

    return approvedBooking
  }

  return finalBooking
}
