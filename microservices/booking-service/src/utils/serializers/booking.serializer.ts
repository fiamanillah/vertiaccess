export function serializeBooking(booking: any) {
  const geometryMeta = (booking.site?.geometryMetadata as any) || {}
  return {
    id: booking.id,
    vaId: booking.vaId || null,
    bookingReference: booking.bookingReference,
    operatorId: booking.operatorId,
    siteId: booking.siteId,
    siteName: booking.site?.name || null,
    siteAddress: booking.site?.address || null,
    assetManagerId: booking.site?.assetManagerId || null,
    siteType: booking.site?.siteType || null,
    siteCategory: booking.site?.siteCategory || null,
    sitePhotoUrl: geometryMeta.photoUrl || null,
    siteGeometry: geometryMeta.geometry || null,
    siteClzGeometry: geometryMeta.clzGeometry || null,
    startTime: booking.startTime?.toISOString?.() || booking.startTime,
    endTime: booking.endTime?.toISOString?.() || booking.endTime,
    operationReference: booking.operationReference || null,
    droneModel: booking.droneModel || null,
    manufacturer: booking.manufacturer || null,
    airframe: booking.airframe || null,
    mtow: booking.mtow || null,
    missionIntent: booking.missionIntent || null,
    operationType: booking.operationType || null,
    siteStatus: booking.site?.status || null,
    siteVaId: booking.site?.vaId || null,
    useCategory: booking.useCategory,
    clzUsed: booking.clzUsed ?? null,
    clzConfirmedAt:
      booking.clzConfirmedAt?.toISOString?.() || booking.clzConfirmedAt || null,
    flyerId: booking.flyerId || null,
    isPayg: booking.isPayg,
    platformFee: booking.platformFee
      ? Number(booking.platformFee.toString())
      : null,
    toalCost: booking.toalCost ? Number(booking.toalCost.toString()) : null,
    cancellationFee: booking.cancellationFee
      ? Number(booking.cancellationFee.toString())
      : null,
    paymentMethodLast4: booking.paymentMethodLast4 || null,
    paymentMethodBrand: booking.paymentMethodBrand || null,
    emergencyAuthAmount: booking.emergencyAuthAmount
      ? Number(booking.emergencyAuthAmount.toString())
      : null,
    emergencyAuthCardLast4: booking.emergencyAuthCardLast4 || null,
    emergencyAuthAgreedAt:
      booking.emergencyAuthAgreedAt?.toISOString?.() ||
      booking.emergencyAuthAgreedAt ||
      null,
    status: booking.status,
    paymentStatus: booking.paymentStatus || null,
    createdAt: booking.createdAt?.toISOString?.() || booking.createdAt,
    respondedAt:
      booking.respondedAt?.toISOString?.() || booking.respondedAt || null,
    cancelledAt:
      booking.cancelledAt?.toISOString?.() || booking.cancelledAt || null,
    operatorEmail: booking.operator?.email || null,
    operatorName: booking.operator?.operatorProfile?.fullName || null,
    operatorPhone:
      booking.operatorPhone ||
      booking.operator?.operatorProfile?.contactPhone ||
      null,
    operatorOrganisation:
      booking.operator?.operatorProfile?.organisation || null,
    operatorFlyerId: booking.operator?.operatorProfile?.flyerId || null,
    operatorReference:
      booking.operator?.operatorProfile?.operatorReference || null,
  }
}

export function serializePaymentMethod(pm: any) {
  return {
    id: pm.id,
    stripePaymentMethodId: pm.stripePaymentMethodId,
    brand: pm.brand,
    last4: pm.last4,
    expiryMonth: Number(pm.expiryMonth),
    expiryYear: Number(pm.expiryYear),
    isDefault: pm.isDefault,
    addedAt: pm.addedAt?.toISOString?.() || pm.addedAt,
  }
}

export function serializeSubscription(subscription: any) {
  const plan = subscription?.plan ?? null
  const hasActiveSubscription =
    Boolean(subscription) &&
    subscription.status === 'ACTIVE' &&
    (!subscription.currentPeriodEnd ||
      subscription.currentPeriodEnd > new Date())

  return {
    hasActiveSubscription,
    status: subscription?.status ?? null,
    planId: subscription?.planId ?? null,
    planName: plan?.name ?? null,
    billingType: hasActiveSubscription ? 'subscription' : 'payg',
    price:
      plan?.monthlyPrice != null ? Number(plan.monthlyPrice.toString()) : null,
    currency: plan?.currency ?? null,
    currentPeriodStart:
      subscription?.currentPeriodStart?.toISOString?.() ||
      subscription?.currentPeriodStart ||
      null,
    currentPeriodEnd:
      subscription?.currentPeriodEnd?.toISOString?.() ||
      subscription?.currentPeriodEnd ||
      null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
  }
}
