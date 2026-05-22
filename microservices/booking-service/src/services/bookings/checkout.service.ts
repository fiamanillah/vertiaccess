import type { CognitoUser } from '@vertiaccess/core'
import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode } from '@vertiaccess/core'
import { loadOperatorBillingContext, getBillingBreakdown } from './billing-helpers'

export async function getCheckoutContext(
  cognitoUser: CognitoUser,
  siteId: string,
  useCategory: 'planned_toal' | 'emergency_recovery',
) {
  const { operator, paymentMethods } = await loadOperatorBillingContext(cognitoUser)

  const site = await db.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      address: true,
      siteType: true,
      clzEnabled: true,
      clzAccessFee: true,
      toalAccessFee: true,
      currency: true,
      status: true,
      deletedAt: true,
    },
  })

  if (!site || site.deletedAt || site.status !== 'ACTIVE') {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found or is not currently active',
      code: 'NOT_FOUND',
    })
  }

  const hasActiveSubscription =
    !!operator.subscription &&
    operator.subscription.status === 'ACTIVE' &&
    (!operator.subscription.currentPeriodEnd ||
      operator.subscription.currentPeriodEnd > new Date())

  const pricing = getBillingBreakdown(site, useCategory, hasActiveSubscription)
  const defaultPaymentMethodId =
    paymentMethods.find((pm) => pm.isDefault)?.id ??
    paymentMethods[0]?.id ??
    null

  return {
    siteId: site.id,
    siteName: site.name,
    siteAddress: site.address,
    useCategory,
    subscription: operator.subscription ?? null,
    pricing,
    paymentMethods,
    defaultPaymentMethodId,
    selectedPaymentMethodId: defaultPaymentMethodId,
    requiresCard: pricing.requiresCard,
  }
}
