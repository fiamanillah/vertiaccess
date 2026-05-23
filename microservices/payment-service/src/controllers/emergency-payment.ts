// microservices/payment-service/src/controllers/emergency-payment.ts
import type { Context } from 'hono'
import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  sendResponse,
  type CognitoUser,
  generateVAID,
  recordBookingLifecycleEvent,
} from '@vertiaccess/core'
import { stripe } from '../services/billing.service.ts'

// ==========================================
// Helpers
// ==========================================

function generateVerificationHash(
  bookingId: string,
  siteId: string,
  operatorId: string,
): string {
  const raw = `${bookingId}:${siteId}:${operatorId}:${Date.now()}`
  return Buffer.from(raw).toString('base64url')
}

async function ensureStripeCustomerId(params: {
  userId: string
  email: string
  fullName?: string | null
  currentStripeCustomerId?: string | null
}): Promise<string> {
  if (params.currentStripeCustomerId) return params.currentStripeCustomerId

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

/**
 * Core function: charge an emergency booking off-session.
 * On success: credits LandownerBalance, creates Transaction, sends notifications.
 * On failure: locks operator account (PAYMENT_LOCKED), notifies operator.
 * Landowner always sees "Processing Payout" regardless of outcome.
 */
export async function chargeEmergencyBooking(params: {
  bookingId: string
  trigger: 'operator_confirmed' | 'admin_dispute'
}): Promise<{ status: 'charged' | 'failed' | 'already_paid' | 'invalid' }> {
  const { bookingId, trigger } = params

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      site: {
        select: { id: true, name: true, landownerId: true, status: true },
      },
      operator: {
        include: {
          operatorProfile: true,
          paymentMethods: { where: { isDefault: true }, take: 1 },
        },
      },
    },
  })

  if (!booking || booking.useCategory !== 'emergency_recovery') {
    return { status: 'invalid' }
  }

  if (booking.paymentStatus === 'charged') {
    return { status: 'already_paid' }
  }

  const operator = booking.operator
  if (!operator) return { status: 'invalid' }

  const defaultCard = operator.paymentMethods?.[0] ?? null
  if (!defaultCard) {
    await recordBookingLifecycleEvent(db as any, {
      bookingId,
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
        error: 'No default payment method found',
      },
    })

    // Lock account — no payment method
    await lockOperatorAccount({
      userId: operator.id,
      bookingId,
      reason: 'No default payment method on file for emergency landing charge.',
      siteName: booking.site?.name ?? 'Unknown Site',
    })
    return { status: 'failed' }
  }

  const amountToCharge = booking.emergencyAuthAmount
    ? Number(booking.emergencyAuthAmount.toString())
    : 150.0

  const stripeCustomerId = await ensureStripeCustomerId({
    userId: operator.id,
    email: operator.email,
    fullName: operator.operatorProfile?.fullName,
    currentStripeCustomerId: operator.operatorProfile?.stripeCustomerId,
  })

  const amountInPence = Math.round(amountToCharge * 100)

  let intent: any
  try {
    intent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: 'gbp',
      customer: stripeCustomerId,
      payment_method: defaultCard.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      description: `Emergency landing charge for booking ${booking.bookingReference}`,
      metadata: {
        userId: operator.id,
        bookingId: booking.id,
        type: 'emergency_charge',
        trigger,
      },
    })
  } catch (err: any) {
    await recordBookingLifecycleEvent(db as any, {
      bookingId,
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
        amount: amountToCharge,
        error: err?.message || 'Unknown Stripe error',
      },
    })

    // Card declined or other Stripe error — lock the account
    await lockOperatorAccount({
      userId: operator.id,
      bookingId,
      reason: `Emergency landing charge of £${amountToCharge.toFixed(2)} failed: ${err.message}`,
      siteName: booking.site?.name ?? 'Unknown Site',
      amountDue: amountToCharge,
    })

    // Mark booking as failed
    await db.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'failed' as any },
    })

    return { status: 'failed' }
  }

  if (intent.status !== 'succeeded') {
    await recordBookingLifecycleEvent(db as any, {
      bookingId,
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
        amount: amountToCharge,
        stripeStatus: intent.status,
      },
    })

    await lockOperatorAccount({
      userId: operator.id,
      bookingId,
      reason: `Emergency landing charge not confirmed. Stripe status: ${intent.status}`,
      siteName: booking.site?.name ?? 'Unknown Site',
      amountDue: amountToCharge,
    })
    await db.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'failed' as any },
    })
    return { status: 'failed' }
  }

  // SUCCESS — record everything and credit landowner
  await db.$transaction(async (tx) => {
    // Update booking
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'charged' as any,
        paymentMethodLast4: defaultCard.last4,
        paymentMethodBrand: defaultCard.brand,
      },
    })

    await recordBookingLifecycleEvent(tx as any, {
      bookingId,
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
        amount: amountToCharge,
        bookingReference: booking.bookingReference,
      },
    })

    // Record transaction
    await tx.transaction.create({
      data: {
        userId: operator.id,
        bookingId: booking.id,
        amount: amountToCharge,
        currency: 'GBP',
        transactionType: 'EMERGENCY_CHARGE',
        status: 'charged',
        stripeChargeId: intent.latest_charge as string | undefined,
        pricingBreakdown: {
          emergencyFee: amountToCharge,
          platformFee: 0,
          trigger,
        },
      },
    })

    // Credit landowner balance
    if (booking.site?.landownerId) {
      await tx.landownerBalance.upsert({
        where: { landownerId: booking.site.landownerId },
        update: { pendingBalance: { increment: amountToCharge } },
        create: {
          landownerId: booking.site.landownerId,
          pendingBalance: amountToCharge,
          availableBalance: 0,
        },
      })
    }

    // Create consent certificate if not already issued
    const existingCert = await tx.consentCertificate.findFirst({
      where: { bookingId: booking.id },
      select: { id: true },
    })

    if (!existingCert) {
      const hash = generateVerificationHash(
        booking.id,
        booking.siteId,
        booking.operatorId,
      )
      const vaId = generateVAID('va-cert')
      await tx.consentCertificate.create({
        data: {
          bookingId: booking.id,
          vaId,
          issueDate: new Date(),
          verificationHash: hash,
          digitalSignature: `SIG_${hash.substring(0, 24)}`,
          verificationUrl: `https://vertiaccess.app/verify/${hash}`,
          siteStatusAtIssue: booking.site?.status || 'ACTIVE',
        },
      })

      await recordBookingLifecycleEvent(tx as any, {
        bookingId,
        eventType: 'CERTIFICATE_ISSUED',
        actorType: 'system',
        actorId: 'system',
        metadata: {
          bookingReference: booking.bookingReference,
          certificateVaId: vaId,
          paymentTrigger: trigger,
        },
      })
    }

    // Notify operator — charge confirmed
    await tx.notification.create({
      data: {
        userId: operator.id,
        type: 'success',
        title: 'Emergency Landing Payment Confirmed',
        message: `£${amountToCharge.toFixed(2)} has been charged to your card ending ${defaultCard.last4} for your emergency landing at "${booking.site?.name}". Your consent certificate is now available.`,
        actionUrl: '/dashboard/operator',
        relatedEntityId: bookingId,
      },
    })

    // Notify landowner — payout confirmed
    if (booking.site?.landownerId) {
      await tx.notification.create({
        data: {
          userId: booking.site.landownerId,
          type: 'success',
          title: 'Emergency Landing Payout Confirmed',
          message: `Payment of £${amountToCharge.toFixed(2)} for booking ${booking.bookingReference} at "${booking.site?.name}" has been confirmed and added to your pending balance.`,
          actionUrl: '/dashboard/landowner',
          relatedEntityId: bookingId,
        },
      })
    }
  })

  return { status: 'charged' }
}

/**
 * Lock an operator account due to a failed emergency charge.
 */
async function lockOperatorAccount(params: {
  userId: string
  bookingId: string
  reason: string
  siteName: string
  amountDue?: number
}) {
  const { userId, bookingId, reason, siteName, amountDue = 150 } = params

  await db.user.update({
    where: { id: userId },
    data: {
      status: 'PAYMENT_LOCKED' as any,
      paymentLockedAt: new Date(),
      paymentLockedReason: reason,
      overdueBookingId: bookingId,
    },
  })

  // Notify operator of lockout
  await db.notification.create({
    data: {
      userId,
      type: 'error',
      title: '🚨 Payment Overdue — Account Suspended',
      message: `Your emergency landing charge of £${amountDue.toFixed(2)} for "${siteName}" could not be processed. Your account has been suspended until the balance is paid. Please update your payment method.`,
      actionUrl: '/dashboard/operator/billing',
      relatedEntityId: bookingId,
    },
  })
}

// ==========================================
// HTTP Handlers
// ==========================================

/**
 * POST /billing/v1/bookings/:bookingId/charge-emergency
 * Internal endpoint — triggered by booking-service after operator confirms usage.
 * Guarded by x-booking-charge-key header.
 */
export async function chargeEmergencyHandler(c: Context): Promise<Response> {
  const configuredKey = process.env.BOOKING_CHARGE_KEY
  if (configuredKey) {
    const receivedKey = c.req.header('x-booking-charge-key')
    if (!receivedKey || receivedKey !== configuredKey) {
      throw new AppError({
        statusCode: HTTPStatusCode.UNAUTHORIZED,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    }
  }

  const bookingId = c.req.param('bookingId')
  const body = await c.req.json().catch(() => ({}))
  const trigger =
    body?.trigger === 'admin_dispute' ? 'admin_dispute' : 'operator_confirmed'

  const result = await chargeEmergencyBooking({ bookingId, trigger })

  return sendResponse(c, {
    message:
      result.status === 'charged'
        ? 'Emergency charge processed successfully'
        : result.status === 'already_paid'
          ? 'Booking already charged'
          : 'Charge failed — account locked',
    data: { status: result.status },
  })
}

/**
 * POST /billing/v1/bookings/:bookingId/admin-dispute-charge
 * Admin-only: force-charge an emergency booking (e.g., when admin confirms usage via evidence).
 */
export async function adminDisputeChargeHandler(c: Context): Promise<Response> {
  const cognitoUser = c.get('cognitoUser') as CognitoUser
  if ((cognitoUser.role || '').toUpperCase() !== 'ADMIN') {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Admin access required',
      code: 'FORBIDDEN',
    })
  }

  const bookingId = c.req.param('bookingId')

  // Verify booking exists and is emergency type
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, useCategory: true, paymentStatus: true },
  })

  if (!booking) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Booking not found',
      code: 'NOT_FOUND',
    })
  }

  if (booking.useCategory !== 'emergency_recovery') {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message:
        'Admin dispute charge only applies to Emergency & Recovery bookings',
      code: 'BAD_REQUEST',
    })
  }

  if (booking.paymentStatus === 'charged') {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'This booking has already been charged',
      code: 'BAD_REQUEST',
    })
  }

  const result = await chargeEmergencyBooking({
    bookingId,
    trigger: 'admin_dispute',
  })

  return sendResponse(c, {
    message:
      result.status === 'charged'
        ? 'Admin dispute charge processed successfully'
        : 'Charge failed — account locked',
    data: { status: result.status },
  })
}

/**
 * POST /billing/v1/payment-methods/retry-overdue
 * Operator retries payment after updating their card.
 * On success: unlocks account (status → VERIFIED), clears lockout fields.
 */
export async function retryOverduePaymentHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = c.get('cognitoUser') as CognitoUser

  const user = await db.user.findUnique({
    where: { id: cognitoUser.sub },
    select: {
      id: true,
      status: true,
      paymentLockedReason: true,
      overdueBookingId: true,
    },
  })

  if (!user) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'User not found',
      code: 'NOT_FOUND',
    })
  }

  if ((user.status as string) !== 'PAYMENT_LOCKED') {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Account is not in a payment-locked state',
      code: 'BAD_REQUEST',
    })
  }

  if (!user.overdueBookingId) {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'No overdue booking found. Please contact support.',
      code: 'BAD_REQUEST',
    })
  }

  const result = await chargeEmergencyBooking({
    bookingId: user.overdueBookingId,
    trigger: 'operator_confirmed',
  })

  if (result.status === 'charged') {
    // Unlock the account
    await db.user.update({
      where: { id: user.id },
      data: {
        status: 'VERIFIED' as any,
        paymentLockedAt: null,
        paymentLockedReason: null,
        overdueBookingId: null,
      },
    })

    await db.notification.create({
      data: {
        userId: user.id,
        type: 'success',
        title: 'Account Restored',
        message:
          'Your payment was successful and your account access has been fully restored.',
        actionUrl: '/dashboard/operator',
      },
    })

    return sendResponse(c, {
      message: 'Payment successful — your account has been unlocked',
      data: { status: 'unlocked' },
    })
  }

  // Still failed — return a helpful error (account stays locked)
  throw new AppError({
    statusCode: 402 as any,
    message:
      'Payment failed again. Please ensure your card has sufficient funds and try again, or contact support.',
    code: 'PAYMENT_FAILED',
  })
}
