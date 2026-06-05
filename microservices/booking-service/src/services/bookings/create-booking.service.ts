import type { CognitoUser } from '@vertiaccess/core'
import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  generateVAID,
  recordBookingLifecycleEvent,
} from '@vertiaccess/core'
import {
  loadOperatorBillingContext,
  getBillingBreakdown,
} from './billing-helpers'
import { chargeApprovedBooking } from '../internal-payment-client'
import {
  generateBookingReference,
  bookingInclude,
} from './utils'

async function triggerApprovedBookingCharge(bookingId: string, paymentMethodId?: string) {
  try {
    const result = await chargeApprovedBooking({
      bookingId,
      trigger: 'approval',
      paymentMethodId,
    })

    if (result.status === 'requires_action') {
      return result
    }

    if (result.status !== 'charged' && result.status !== 'already_paid') {
      throw new AppError({
        statusCode: HTTPStatusCode.PAYMENT_REQUIRED,
        message: 'Payment failed. Please update your card and try again.',
        code: 'PAYMENT_FAILED',
      })
    }

    return result
  } catch (error) {
    console.error(
      `[createBooking] Failed to charge booking ${bookingId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

export async function createBooking(cognitoUser: CognitoUser, body: any) {
  const { operator, paymentMethods } =
    await loadOperatorBillingContext(cognitoUser)

  const site = await db.site.findUnique({
    where: { id: body.siteId },
    include: { assetOwner: { select: { id: true, email: true } } },
  })

  if (!site || site.deletedAt || site.status !== 'ACTIVE') {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found or is not currently active',
      code: 'NOT_FOUND',
    })
  }

  const { startTime, endTime, useCategory } = body

  const bookingStart = new Date(startTime)
  const bookingEnd = new Date(endTime)
  const bookingStartDate = startTime.slice(0, 10)
  const bookingEndDate = endTime.slice(0, 10)

  if (
    Number.isNaN(bookingStart.getTime()) ||
    Number.isNaN(bookingEnd.getTime()) ||
    bookingEnd <= bookingStart ||
    bookingStartDate !== bookingEndDate
  ) {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message:
        'Invalid booking time range. Bookings must stay within a single date.',
      code: 'BAD_REQUEST',
    })
  }

  const isEmergency = useCategory === 'emergency_recovery'
  const canBookEmergency = Boolean(
    site.clzEnabled ||
    site.siteType === 'emergency' ||
    site.clzAccessFee != null,
  )
  const canBookToal =
    site.siteType !== 'emergency' || site.toalAccessFee != null

  if ((isEmergency && !canBookEmergency) || (!isEmergency && !canBookToal)) {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'The selected booking type is not available for this site',
      code: 'BAD_REQUEST',
    })
  }

  const hasActiveSubscription =
    !!operator.subscription &&
    operator.subscription.status === 'ACTIVE' &&
    (!operator.subscription.currentPeriodEnd ||
      operator.subscription.currentPeriodEnd > new Date())

  const billing = getBillingBreakdown(site, useCategory, hasActiveSubscription)

  const selectedPaymentMethodId =
    body.paymentMethodId ??
    paymentMethods.find((pm) => pm.isDefault)?.id ??
    paymentMethods[0]?.id ??
    null
  const selectedPaymentMethod = selectedPaymentMethodId
    ? paymentMethods.find((pm) => pm.id === selectedPaymentMethodId)
    : null

  if (billing.requiresCard && !selectedPaymentMethod) {
    throw new AppError({
      statusCode: 402 as any,
      message:
        'Payment method required: add a card before creating this booking.',
      code: 'PAYMENT_REQUIRED',
    })
  }

  if (body.paymentMethodId && !selectedPaymentMethod) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Selected payment method not found',
      code: 'NOT_FOUND',
    })
  }

  const isPayg = billing.billingMode === 'payg'
  const finalBookingStatus = site.autoApprove ? 'APPROVED' : 'PENDING'
  // Charge immediately for approved planned TOAL bookings when there is
  // a non-zero amount due now (covers PAYG and subscription cases).
  const shouldChargeImmediately =
    finalBookingStatus === 'APPROVED' &&
    useCategory === 'planned_toal' &&
    (billing.totalDueNow ?? 0) > 0

  const initialBookingStatus = shouldChargeImmediately ? 'PENDING' : finalBookingStatus
  const initialPaymentStatus = isEmergency
    ? 'authorized'
    : shouldChargeImmediately
      ? 'pending_charge'
      : isPayg
        ? 'pending'
        : null
  const bookingReference = generateBookingReference()
  const vaId = generateVAID('va-bkg')

  const created = await db.$transaction(async (tx) => {
    // --- Duplicate / Overlap Guard ---
    // Prevent the same operator from booking the same site in an overlapping window
    const overlapping = await tx.booking.findFirst({
      where: {
        siteId: body.siteId,
        operatorId: cognitoUser.sub,
        status: { in: ['PENDING', 'APPROVED'] },
        startTime: { lt: bookingEnd },
        endTime: { gt: bookingStart },
      },
      select: { id: true, bookingReference: true },
    })

    if (overlapping) {
      throw new AppError({
        statusCode: HTTPStatusCode.CONFLICT,
        message: `You already have an active booking (${overlapping.bookingReference}) for this site that overlaps the requested time. Please cancel it first or choose a different time.`,
        code: 'BOOKING_CONFLICT',
      })
    }

    const newBooking = await tx.booking.create({
      data: {
        operatorId: cognitoUser.sub,
        siteId: body.siteId,
        bookingReference,
        vaId,
        startTime: bookingStart,
        endTime: bookingEnd,
        operationReference: body.operationReference || null,
        droneModel: body.droneModel,
        manufacturer: body.manufacturer,
        airframe: body.airframe,
        mtow: body.mtow,
        missionIntent: body.missionIntent,
        operatorPhone: body.operatorPhone || null,
        useCategory: useCategory as any,
        isPayg,
        platformFee: billing.platformFee > 0 ? billing.platformFee : null,
        toalCost: billing.assetOwnerFee > 0 ? billing.assetOwnerFee : null,
        paymentMethodLast4: selectedPaymentMethod?.last4 ?? null,
        paymentMethodBrand: selectedPaymentMethod?.brand ?? null,
        emergencyAuthAgreedAt: isEmergency ? new Date() : null,
        emergencyAuthCardLast4: isEmergency
          ? (selectedPaymentMethod?.last4 ?? null)
          : null,
        emergencyAuthAmount: isEmergency ? billing.authorizationAmount : null,
        status: initialBookingStatus as any,
        paymentStatus: initialPaymentStatus as any,
        respondedAt: initialBookingStatus === 'APPROVED' ? new Date() : null,
      },
      include: {
        site: { select: { name: true, address: true, assetOwnerId: true } },
        operator: false as any,
      },
    })

    await recordBookingLifecycleEvent(tx as any, {
      bookingId: newBooking.id,
      eventType: 'BOOKING_CREATED',
      actorType: 'operator',
      actorId: cognitoUser.sub,
      newState: {
        status: initialBookingStatus,
        paymentStatus: initialPaymentStatus,
      },
      metadata: {
        bookingReference,
        siteId: body.siteId,
        useCategory: body.useCategory,
        isPayg,
      },
    })

    // Record BOOKING_SUBMITTED for bookings that need assetowner approval
    if (finalBookingStatus === 'PENDING') {
      await recordBookingLifecycleEvent(tx as any, {
        bookingId: newBooking.id,
        eventType: 'BOOKING_SUBMITTED',
        actorType: 'operator',
        actorId: cognitoUser.sub,
        newState: { status: 'PENDING' },
        metadata: {
          bookingReference,
          awaitingAssetOwnerApproval: true,
        },
      })
    }

    if (initialBookingStatus === 'APPROVED') {
      await recordBookingLifecycleEvent(tx as any, {
        bookingId: newBooking.id,
        eventType: 'BOOKING_APPROVED',
        actorType: 'system',
        actorId: 'system',
        newState: { status: 'APPROVED' },
        metadata: {
          autoApproved: true,
          bookingReference,
        },
      })
    }

    if (!shouldChargeImmediately) {
      // operator notification
      await tx.notification.create({
        data: {
          userId: cognitoUser.sub,
          type: 'info',
          title:
            initialBookingStatus === 'APPROVED'
              ? 'Booking Confirmed'
              : 'Booking Submitted',
          message: isEmergency
            ? `Your Emergency Standby booking for "${site.name}" (${bookingReference}) is confirmed. £${(billing.authorizationAmount ?? 0).toFixed(2)} will only be charged if you confirm the site was used.`
            : initialBookingStatus === 'APPROVED' && isPayg
              ? `Your booking for "${site.name}" (${bookingReference}) has been automatically approved. We are charging your default card now.`
              : initialBookingStatus === 'APPROVED'
                ? `Your booking for "${site.name}" (${bookingReference}) has been automatically approved.`
                : `Your booking request for "${site.name}" (${bookingReference}) has been submitted and is pending assetowner approval.`,
          actionUrl: '/dashboard/operator',
          relatedEntityId: newBooking.id,
        },
      })
    }

    // assetowner notification (only when pending)
    if (finalBookingStatus === 'PENDING') {
      await tx.notification.create({
        data: {
          userId: site.assetOwnerId,
          type: 'info',
          title: 'New Booking Request',
          message: `A new booking request (${bookingReference}) for your site "${site.name}" is awaiting your approval.`,
          actionUrl: '/dashboard/assetowner',
          relatedEntityId: newBooking.id,
        },
      })
    }



    return newBooking
  })

  // refetch with full includes for serialization
  let booking = await db.booking.findUnique({
    where: { id: created.id },
    include: bookingInclude,
  })

  if (!booking) {
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Booking could not be loaded after creation',
      code: 'INTERNAL_ERROR',
    })
  }
  let requiresAction = false
  let clientSecret: string | null = null

  if (shouldChargeImmediately) {
    const bId = booking.id
    const bRef = booking.bookingReference
    try {
      const chargeResult = await triggerApprovedBookingCharge(bId, selectedPaymentMethod?.id)
      if (chargeResult?.status === 'requires_action') {
        requiresAction = true
        clientSecret = chargeResult.clientSecret ?? null
        // Record that we are waiting on 3D Secure confirmation
        await recordBookingLifecycleEvent(undefined, {
          bookingId: bId,
          eventType: 'PAYMENT_INITIATED',
          actorType: 'system',
          actorId: 'stripe',
          newState: { paymentStatus: 'pending_charge', requiresAction: true },
          metadata: {
            bookingReference: bRef,
            trigger: '3ds_required',
          },
        })
      } else {
        // If charge succeeded without action, we can now mark it APPROVED.
        booking = await db.$transaction(async (tx) => {
          const updated = await tx.booking.update({
            where: { id: bId },
            data: { status: 'APPROVED', respondedAt: new Date() },
            include: bookingInclude,
          })
          await recordBookingLifecycleEvent(tx as any, {
            bookingId: bId,
            eventType: 'BOOKING_APPROVED',
            actorType: 'system',
            actorId: 'system',
            previousState: { status: 'PENDING' },
            newState: { status: 'APPROVED' },
            metadata: {
              bookingReference: bRef,
              autoApproved: true,
              paymentTriggered: true,
            },
          })
          return updated
        }) as any
        if (!booking) throw new Error('Booking is null after transaction')
      }
    } catch (error) {
      const bId = booking!.id
      const bRef = booking!.bookingReference
      console.error(`[createBooking] triggerApprovedBookingCharge failed for booking ${bId}:`, error)
      try {
        await db.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: bId },
            data: {
              status: 'REJECTED' as any,
              paymentStatus: 'failed' as any,
              respondedAt: new Date(),
            },
          })

          await recordBookingLifecycleEvent(tx as any, {
            bookingId: bId,
            eventType: 'PAYMENT_FAILED',
            actorType: 'system',
            actorId: 'stripe',
            previousState: {
              status: 'PENDING',
              paymentStatus: 'pending',
            },
            newState: {
              status: 'REJECTED',
              paymentStatus: 'failed',
            },
            metadata: {
              bookingReference: bRef,
              trigger: 'approval',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          })

          await tx.notification.create({
            data: {
              userId: cognitoUser.sub,
              type: 'error',
              title: 'Payment Failed',
              message: `We could not charge your card for booking "${site.name}" (${bRef}). Please update your card and try again.`,
              actionUrl: '/dashboard/operator/billing',
              relatedEntityId: bId,
            },
          })
        })
      } catch (dbError) {
        console.error(`[createBooking] DB Rollback failed for booking ${bId}:`, dbError)
      }

      throw error
    }

    if (requiresAction) {
      return {
        requiresAction: true,
        clientSecret,
        bookingId: booking!.id,
        status: 'PENDING_PAYMENT',
      }
    }

    await db.$transaction(async (tx) => {
      await tx.notification.create({
        data: {
          userId: cognitoUser.sub,
          type: 'success',
          title: 'Booking Confirmed',
          message: `Your booking for "${site.name}" (${booking!.bookingReference}) has been approved and payment was processed successfully.`,
          actionUrl: '/dashboard/operator',
          relatedEntityId: booking!.id,
        },
      })
    })

    const approvedBooking = await db.booking.findUnique({
      where: { id: booking!.id },
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

  return booking
}
