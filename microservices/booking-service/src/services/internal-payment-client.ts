import Stripe from 'stripe'
import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  config,
  generateVAID,
  recordBookingLifecycleEvent,
} from '@vertiaccess/core'

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

export function getStripeClient() {
  return stripe
}

type ApprovalTrigger = 'manual' | 'approval' | 'scheduled'
type EmergencyTrigger = 'operator_confirmed' | 'admin_dispute'

function parseAmount(value: unknown): number {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'object' && value.toString) {
    return Number(value.toString())
  }
  return 0
}

export async function ensureStripeCustomerId(params: {
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



async function chargeStripeAmount(params: {
  amount: number
  customerId: string
  paymentMethodId: string
  description: string
  metadata: Record<string, string | number | null>
}) {
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(params.amount * 100),
    currency: 'gbp',
    customer: params.customerId,
    payment_method: params.paymentMethodId,
    off_session: true,
    confirm: true,
    description: params.description,
    metadata: params.metadata,
    return_url: 'https://vertiaccess.app/dashboard/operator/billing', // fallback, though React Stripe.js handles it mostly
  })

  if (
    intent.status === 'requires_action'
  ) {
    return intent
  }

  if (intent.status !== 'succeeded') {
    throw new AppError({
      statusCode: HTTPStatusCode.PAYMENT_REQUIRED,
      message: `Payment not confirmed. Stripe status: ${intent.status}`,
      code: 'PAYMENT_NOT_CONFIRMED',
    })
  }

  return intent
}

export async function chargeApprovedBooking(params: {
  bookingId: string
  trigger: ApprovalTrigger
  paymentMethodId?: string
}) {
  const booking = await db.booking.findUnique({
    where: { id: params.bookingId },
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

  if (!booking) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Booking not found',
      code: 'NOT_FOUND',
    })
  }

  if (booking.paymentStatus === 'charged') {
    return { status: 'already_paid' as const, amount: 0 }
  }

  if (booking.status !== 'APPROVED' && !(params.trigger === 'approval' && booking.status === 'PENDING')) {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Booking is not approved for charge',
      code: 'BOOKING_NOT_APPROVED',
    })
  }

  let targetCard = null
  if (params.paymentMethodId) {
    targetCard = await db.paymentMethod.findUnique({
      where: { id: params.paymentMethodId }
    })
  } else {
    targetCard = booking.operator?.paymentMethods?.[0] ?? null
  }

  if (!targetCard) {
    throw new AppError({
      statusCode: 402 as any,
      message:
        'Payment method not found. Please add a card before charging.',
      code: 'PAYMENT_REQUIRED',
    })
  }

  const toalCost = parseAmount(booking.toalCost)
  const platformFee = parseAmount(booking.platformFee)
  const totalToCharge = toalCost + platformFee

  if (totalToCharge <= 0) {
    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'charged' as any,
          paymentMethodLast4: targetCard.last4,
          paymentMethodBrand: targetCard.brand,
        },
      })

      await tx.transaction.create({
        data: {
          userId: booking.operatorId,
          bookingId: booking.id,
          amount: totalToCharge,
          currency: 'GBP',
          transactionType: 'PAYG_BOOKING',
          status: 'charged',
          pricingBreakdown: {
            toalCost,
            platformFee,
            cardLast4: targetCard.last4,
            cardBrand: targetCard.brand,
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


    })

    return { status: 'charged' as const, amount: totalToCharge }
  }

  const stripeCustomerId = await ensureStripeCustomerId({
    userId: booking.operator.id,
    email: booking.operator.email,
    fullName: booking.operator.operatorProfile?.fullName,
    currentStripeCustomerId: booking.operator.operatorProfile?.stripeCustomerId,
  })

  const intent = await chargeStripeAmount({
    amount: totalToCharge,
    customerId: stripeCustomerId,
    paymentMethodId: targetCard.stripePaymentMethodId,
    description: `${params.trigger === 'scheduled' ? 'Scheduled' : params.trigger === 'approval' ? 'Approval' : 'Manual'} booking charge for ${booking.bookingReference}`,
    metadata: {
      userId: booking.operator.id,
      bookingId: booking.id,
      type: 'booking_charge',
      trigger: params.trigger,
    },
  })

  if (
    intent.status === 'requires_action'
  ) {
    return {
      status: 'requires_action' as const,
      clientSecret: intent.client_secret,
      amount: totalToCharge,
    }
  }

  await db.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'charged' as any,
        paymentMethodLast4: targetCard.last4,
        paymentMethodBrand: targetCard.brand,
      },
    })

    await recordBookingLifecycleEvent(tx as any, {
      bookingId: booking.id,
      eventType: 'PAYMENT_CHARGED',
      actorType: 'system',
      actorId: 'stripe',
      previousState: { paymentStatus: booking.paymentStatus },
      newState: {
        paymentStatus: 'charged',
        paymentMethodLast4: targetCard.last4,
        paymentMethodBrand: targetCard.brand,
      },
      metadata: { trigger: params.trigger, amount: totalToCharge, bookingReference: booking.bookingReference },
    })

    await tx.transaction.create({
      data: {
        userId: booking.operatorId,
        bookingId: booking.id,
        amount: totalToCharge,
        currency: 'GBP',
        transactionType: 'PAYG_BOOKING',
        status: 'charged',
        stripeChargeId: intent.latest_charge as string | undefined,
        pricingBreakdown: {
          toalCost,
          platformFee,
          cardLast4: targetCard.last4,
          cardBrand: targetCard.brand,
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


  })

  return { status: 'charged' as const, amount: totalToCharge }
}

export async function chargeEmergencyBooking(params: {
  bookingId: string
  trigger: EmergencyTrigger
}) {
  const booking = await db.booking.findUnique({
    where: { id: params.bookingId },
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
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Invalid emergency booking for charge',
      code: 'INVALID_BOOKING',
    })
  }

  if (booking.paymentStatus === 'charged') {
    return { status: 'already_paid' as const }
  }

  const defaultCard = booking.operator?.paymentMethods?.[0] ?? null
  if (!defaultCard) {
    throw new AppError({
      statusCode: 402 as any,
      message:
        'No default payment method found. Please add a card before charging.',
      code: 'PAYMENT_REQUIRED',
    })
  }

  const amountToCharge = parseAmount(booking.emergencyAuthAmount) || 150

  const stripeCustomerId = await ensureStripeCustomerId({
    userId: booking.operator.id,
    email: booking.operator.email,
    fullName: booking.operator.operatorProfile?.fullName,
    currentStripeCustomerId: booking.operator.operatorProfile?.stripeCustomerId,
  })

  const intent = await chargeStripeAmount({
    amount: amountToCharge,
    customerId: stripeCustomerId,
    paymentMethodId: defaultCard.stripePaymentMethodId,
    description: `Emergency landing charge for ${booking.bookingReference}`,
    metadata: {
      userId: booking.operator.id,
      bookingId: booking.id,
      type: 'emergency_charge',
      trigger: params.trigger,
    },
  })

  await db.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'charged' as any,
        paymentMethodLast4: defaultCard.last4,
        paymentMethodBrand: defaultCard.brand,
      },
    })

    await recordBookingLifecycleEvent(tx as any, {
      bookingId: booking.id,
      eventType: 'PAYMENT_CHARGED',
      actorType: 'system',
      actorId: 'stripe',
      previousState: { paymentStatus: booking.paymentStatus },
      newState: {
        paymentStatus: 'charged',
        paymentMethodLast4: defaultCard.last4,
        paymentMethodBrand: defaultCard.brand,
      },
      metadata: { trigger: params.trigger, amount: amountToCharge, bookingReference: booking.bookingReference },
    })

    await tx.transaction.create({
      data: {
        userId: booking.operatorId,
        bookingId: booking.id,
        amount: amountToCharge,
        currency: 'GBP',
        transactionType: 'EMERGENCY_CHARGE',
        status: 'charged',
        stripeChargeId: intent.latest_charge as string | undefined,
        pricingBreakdown: {
          emergencyFee: amountToCharge,
          platformFee: 0,
          trigger: params.trigger,
          cardLast4: defaultCard.last4,
          cardBrand: defaultCard.brand,
        },
      },
    })

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


  })

  return { status: 'charged' as const }
}
