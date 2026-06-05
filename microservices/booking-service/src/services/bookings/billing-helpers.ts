import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode, type CognitoUser } from '@vertiaccess/core'

export interface BillingBreakdown {
  billingMode: 'subscription' | 'payg'
  assetOwnerFee: number
  platformFee: number
  totalDueNow: number
  authorizationAmount: number | null
  currency: string
  requiresCard: boolean
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

export function getBillingBreakdown(
  site: any,
  useCategory: 'planned_toal' | 'emergency_recovery',
  hasActiveSubscription: boolean,
): BillingBreakdown {
  const isEmergency = useCategory === 'emergency_recovery'
  const assetOwnerFee = isEmergency
    ? site.clzAccessFee != null
      ? Number(site.clzAccessFee.toString())
      : 150
    : site.toalAccessFee != null
      ? Number(site.toalAccessFee.toString())
      : 0
  const platformFee = hasActiveSubscription ? 0 : isEmergency ? 0 : 5
  const totalDueNow = isEmergency ? 0 : assetOwnerFee + platformFee

  return {
    billingMode: hasActiveSubscription ? 'subscription' : 'payg',
    assetOwnerFee,
    platformFee,
    totalDueNow,
    authorizationAmount: isEmergency ? assetOwnerFee : null,
    currency: site.currency || 'GBP',
    requiresCard: isEmergency || totalDueNow > 0,
  }
}
