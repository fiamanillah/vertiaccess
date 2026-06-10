import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode, type CognitoUser } from '@vertiaccess/core'

export interface BillingBreakdown {
  billingMode: 'subscription' | 'payg'
  assetManagerFee: number
  platformFee: number
  totalDueNow: number
  authorizationAmount: number | null
  currency: string
  requiresCard: boolean
  isWaived?: boolean
  waivedBookingsLimit?: number | null
  waivedBookingsUsed?: number
  waivedBookingsRemaining?: number | null
  defaultPlatformFee?: number
}

export async function loadOperatorBillingContext(cognitoUser: CognitoUser) {
  const operator = await db.user.findUnique({
    where: { id: cognitoUser.sub },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  })

  if (!operator) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Operator account not found',
      code: 'NOT_FOUND',
    })
  }

  if (operator.role !== 'OPERATOR') {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Only operators can create bookings',
      code: 'FORBIDDEN',
    })
  }

  if (operator.status !== 'VERIFIED') {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Your account must be verified before booking a site',
      code: 'FORBIDDEN',
    })
  }

  const paymentMethods = await db.paymentMethod.findMany({
    where: { userId: cognitoUser.sub },
    orderBy: [{ isDefault: 'desc' }, { addedAt: 'desc' }],
  })

  return { operator, paymentMethods }
}

export async function getBillingBreakdown(
  site: any,
  useCategory: 'planned_toal' | 'emergency_recovery',
  operatorId: string,
  operatorSubscription: any,
): Promise<BillingBreakdown> {
  const isEmergency = useCategory === 'emergency_recovery'
  const assetManagerFee = isEmergency
    ? site.clzAccessFee != null
      ? Number(site.clzAccessFee.toString())
      : 150
    : site.toalAccessFee != null
      ? Number(site.toalAccessFee.toString())
      : 0

  // 1. Fetch active plans to find the PAYG plan per-booking fee
  const activePlans = await db.subscriptionPlan.findMany({
    where: { isActive: true },
  })
  const paygPlan = activePlans.find((p: any) => {
    try {
      const features = typeof p.features === 'string' ? JSON.parse(p.features) : p.features
      return features?.billingType === 'payg'
    } catch {
      return false
    }
  })

  let paygFee = 0
  if (paygPlan) {
    const features = typeof paygPlan.features === 'string' ? JSON.parse(paygPlan.features) : paygPlan.features
    paygFee = typeof features?.platformFee === 'number'
      ? features.platformFee
      : Number(paygPlan.monthlyPrice?.toString() || 0)
  }

  // 2. Parse current active subscription & verify limits
  const planFeatures = operatorSubscription?.plan?.features
    ? (typeof operatorSubscription.plan.features === 'string'
      ? JSON.parse(operatorSubscription.plan.features)
      : operatorSubscription.plan.features)
    : null

  const billingType = planFeatures?.billingType || 'subscription'
  const hasActiveSubscription =
    !!operatorSubscription &&
    operatorSubscription.status === 'ACTIVE' &&
    (!operatorSubscription.currentPeriodEnd ||
      operatorSubscription.currentPeriodEnd > new Date()) &&
    billingType === 'subscription'

  let platformFee = paygFee
  let isWaived = false
  let waivedBookingsLimit: number | null = null
  let waivedBookingsUsed = 0
  let waivedBookingsRemaining: number | null = null

  if (hasActiveSubscription) {
    waivedBookingsLimit = typeof planFeatures?.waivedBookingsLimit === 'number'
      ? planFeatures.waivedBookingsLimit
      : null

    const start = operatorSubscription.currentPeriodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const end = operatorSubscription.currentPeriodEnd || new Date()
    waivedBookingsUsed = await db.booking.count({
      where: {
        operatorId,
        status: { in: ['APPROVED', 'ACTIVATED', 'COMPLETED'] },
        createdAt: {
          gte: start,
          lte: end,
        },
        useCategory: 'planned_toal',
      },
    })

    if (waivedBookingsLimit === null || waivedBookingsUsed < waivedBookingsLimit) {
      platformFee = 0
      isWaived = true
    }

    if (waivedBookingsLimit !== null) {
      waivedBookingsRemaining = Math.max(0, waivedBookingsLimit - waivedBookingsUsed)
    }
  }

  if (isEmergency) {
    platformFee = 0
  }

  const totalDueNow = isEmergency ? 0 : assetManagerFee + platformFee

  return {
    billingMode: hasActiveSubscription ? 'subscription' : 'payg',
    assetManagerFee,
    platformFee,
    totalDueNow,
    authorizationAmount: isEmergency ? assetManagerFee : null,
    currency: site.currency || 'GBP',
    requiresCard: isEmergency || totalDueNow > 0,
    isWaived,
    waivedBookingsLimit,
    waivedBookingsUsed,
    waivedBookingsRemaining,
    defaultPlatformFee: paygFee,
  }
}
