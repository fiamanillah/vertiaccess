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
import {
  generateBookingReference,
  generateVerificationHash,
  bookingInclude,
} from './utils'

async function triggerApprovedBookingCharge(bookingId: string) {
  const paymentServiceUrl = process.env.PAYMENT_SERVICE_INTERNAL_URL
  const chargeKey = process.env.BOOKING_CHARGE_KEY

  if (!paymentServiceUrl || !chargeKey) {
    return
  }

  try {
    const response = await fetch(
      `${paymentServiceUrl}/billing/v1/bookings/${bookingId}/charge-approved`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-booking-charge-key': chargeKey,
        },
      },
    )

    if (!response.ok) {
      const rawBody = await response.text()
      let message = 'Payment failed. Please update your card and try again.'

      if (rawBody) {
        try {
          const parsed = JSON.parse(rawBody) as { message?: string }
          if (parsed?.message) {
            message = parsed.message
          }
        } catch {
          message = rawBody
        }
      }

      throw new AppError({
        statusCode: response.status as any,
        message,
        code: 'PAYMENT_FAILED',
      })
    }
  } catch (error) {
    console.error(
      `[createBooking] Failed to trigger approval charge for booking ${bookingId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )

    if (error instanceof AppError) {
      throw error
    }

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
    include: { landowner: { select: { id: true, email: true } } },
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
  const bookingStatus = site.autoApprove ? 'APPROVED' : 'PENDING'
  const shouldChargeImmediately =
    bookingStatus === 'APPROVED' && isPayg && useCategory === 'planned_toal'
  const bookingReference = generateBookingReference()
  const vaId = generateVAID('va-bkg')

  const created = await db.$transaction(async (tx) => {
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
        missionIntent: body.missionIntent,
        useCategory: useCategory as any,
        isPayg,
        platformFee: billing.platformFee > 0 ? billing.platformFee : null,
        toalCost: billing.landownerFee > 0 ? billing.landownerFee : null,
        paymentMethodLast4: selectedPaymentMethod?.last4 ?? null,
        paymentMethodBrand: selectedPaymentMethod?.brand ?? null,
        emergencyAuthAgreedAt: isEmergency ? new Date() : null,
        emergencyAuthCardLast4: isEmergency
          ? (selectedPaymentMethod?.last4 ?? null)
          : null,
        emergencyAuthAmount: isEmergency ? billing.authorizationAmount : null,
        status: bookingStatus as any,
        paymentStatus: isEmergency ? 'authorized' : isPayg ? 'pending' : null,
        respondedAt: bookingStatus === 'APPROVED' ? new Date() : null,
      },
      include: {
        site: { select: { name: true, address: true, landownerId: true } },
        operator: false as any,
        certificates: false as any,
      },
    })

    await recordBookingLifecycleEvent(tx as any, {
      bookingId: newBooking.id,
      eventType: 'BOOKING_CREATED',
      actorType: 'operator',
      actorId: cognitoUser.sub,
      newState: {
        status: bookingStatus,
        paymentStatus: isEmergency ? 'authorized' : isPayg ? 'pending' : null,
      },
      metadata: {
        bookingReference,
        siteId: body.siteId,
        useCategory: body.useCategory,
        isPayg,
      },
    })

    if (bookingStatus === 'APPROVED') {
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
            bookingStatus === 'APPROVED'
              ? 'Booking Confirmed'
              : 'Booking Submitted',
          message: isEmergency
            ? `Your Emergency Standby booking for "${site.name}" (${bookingReference}) is confirmed. £${(billing.authorizationAmount ?? 0).toFixed(2)} will only be charged if you confirm the site was used.`
            : bookingStatus === 'APPROVED' && isPayg
              ? `Your booking for "${site.name}" (${bookingReference}) has been automatically approved. We are charging your default card now.`
              : bookingStatus === 'APPROVED'
                ? `Your booking for "${site.name}" (${bookingReference}) has been automatically approved.`
                : `Your booking request for "${site.name}" (${bookingReference}) has been submitted and is pending landowner approval.`,
          actionUrl: '/dashboard/operator',
          relatedEntityId: newBooking.id,
        },
      })
    }

    // landowner notification (only when pending)
    if (bookingStatus === 'PENDING') {
      await tx.notification.create({
        data: {
          userId: site.landownerId,
          type: 'info',
          title: 'New Booking Request',
          message: `A new booking request (${bookingReference}) for your site "${site.name}" is awaiting your approval.`,
          actionUrl: '/dashboard/landowner',
          relatedEntityId: newBooking.id,
        },
      })
    }

    // certificate creation on auto-approve
    if (bookingStatus === 'APPROVED' && !shouldChargeImmediately) {
      const existingCert = await tx.consentCertificate.findFirst({
        where: { bookingId: newBooking.id },
        select: { id: true },
      })

      if (!existingCert) {
        const hash = generateVerificationHash(
          newBooking.id,
          site.id,
          cognitoUser.sub,
        )
        const certVaId = generateVAID('va-cert')
        await tx.consentCertificate.create({
          data: {
            bookingId: newBooking.id,
            vaId: certVaId,
            issueDate: new Date(),
            verificationHash: hash,
            digitalSignature: `SIG_${hash.substring(0, 24)}`,
            verificationUrl: `https://vertiaccess.app/verify/${hash}`,
            siteStatusAtIssue: site.status,
          },
        })

        await recordBookingLifecycleEvent(tx as any, {
          bookingId: newBooking.id,
          eventType: 'CERTIFICATE_ISSUED',
          actorType: 'system',
          actorId: 'system',
          metadata: {
            bookingReference,
            certificateVaId: certVaId,
          },
        })
      }
    }

    return newBooking
  })

  // refetch with full includes for serialization
  const booking = await db.booking.findUnique({
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

  if (shouldChargeImmediately) {
    try {
      await triggerApprovedBookingCharge(booking.id)
    } catch (error) {
      await db.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'REJECTED' as any,
            paymentStatus: 'failed' as any,
            respondedAt: new Date(),
          },
        })

        await recordBookingLifecycleEvent(tx as any, {
          bookingId: booking.id,
          eventType: 'PAYMENT_FAILED',
          actorType: 'system',
          actorId: 'stripe',
          previousState: {
            status: 'APPROVED',
            paymentStatus: 'pending',
          },
          newState: {
            status: 'REJECTED',
            paymentStatus: 'failed',
          },
          metadata: {
            bookingReference,
            trigger: 'approval',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        await tx.notification.create({
          data: {
            userId: cognitoUser.sub,
            type: 'error',
            title: 'Payment Failed',
            message: `We could not charge your card for booking "${site.name}" (${bookingReference}). Please update your card and try again.`,
            actionUrl: '/dashboard/operator/billing',
            relatedEntityId: booking.id,
          },
        })
      })

      throw error
    }

    const approvedBooking = await db.booking.findUnique({
      where: { id: booking.id },
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
