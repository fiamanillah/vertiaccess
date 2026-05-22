// services/site-service/src/controllers/bookings.ts
import type { Context } from 'hono'
import { z } from 'zod'
import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  sendResponse,
  sendCreatedResponse,
  type CognitoUser,
  generateVAID,
} from '@vertiaccess/core'
import {
  createBookingSchema,
  updateBookingStatusSchema,
  confirmEmergencyUsageSchema,
} from '../schemas/booking.schema.ts'

// ==========================================
// Helpers
// ==========================================

function getCognitoUser(c: Context): CognitoUser {
  return c.get('cognitoUser') as CognitoUser
}

/** Generate a VA booking reference: VA-BKG-XXXXXXXX */
function generateBookingReference(): string {
  const chars = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `VA-BKG-${chars.padEnd(8, 'X').substring(0, 8)}`
}

/** Generate a deterministic verification hash for a consent certificate */
function generateVerificationHash(
  bookingId: string,
  siteId: string,
  operatorId: string,
): string {
  const raw = `${bookingId}:${siteId}:${operatorId}:${Date.now()}`
  return Buffer.from(raw).toString('base64url')
}

function serializeBooking(booking: any) {
  const cert = booking.certificates?.[0] ?? null
  const geometryMeta = (booking.site?.geometryMetadata as any) || {}
  return {
    id: booking.id,
    vaId: booking.vaId || null,
    bookingReference: booking.bookingReference,
    operatorId: booking.operatorId,
    siteId: booking.siteId,
    siteName: booking.site?.name || null,
    siteAddress: booking.site?.address || null,
    landownerId: booking.site?.landownerId || null,
    siteType: booking.site?.siteType || null,
    siteCategory: booking.site?.siteCategory || null,
    sitePhotoUrl: geometryMeta.photoUrl || null,
    siteGeometry: geometryMeta.geometry || null,
    siteClzGeometry: geometryMeta.clzGeometry || null,
    startTime: booking.startTime?.toISOString?.() || booking.startTime,
    endTime: booking.endTime?.toISOString?.() || booking.endTime,
    operationReference: booking.operationReference || null,
    droneModel: booking.droneModel || null,
    missionIntent: booking.missionIntent || null,
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
    // Payment card snapshot for masked display
    paymentMethodLast4: booking.paymentMethodLast4 || null,
    paymentMethodBrand: booking.paymentMethodBrand || null,
    // Emergency authorization capture (used in order summary & lockout screen)
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
    // operator info joined
    operatorEmail: booking.operator?.email || null,
    operatorName: booking.operator?.operatorProfile?.fullName || null,
    operatorOrganisation:
      booking.operator?.operatorProfile?.organisation || null,
    operatorFlyerId: booking.operator?.operatorProfile?.flyerId || null,
    // Certificate info if available
    certificateVaId: cert?.vaId || null,
    certificateId: cert?.id || null,
  }
}

function serializePaymentMethod(paymentMethod: any) {
  return {
    id: paymentMethod.id,
    stripePaymentMethodId: paymentMethod.stripePaymentMethodId,
    brand: paymentMethod.brand,
    last4: paymentMethod.last4,
    expiryMonth: Number(paymentMethod.expiryMonth),
    expiryYear: Number(paymentMethod.expiryYear),
    isDefault: paymentMethod.isDefault,
    addedAt: paymentMethod.addedAt?.toISOString?.() || paymentMethod.addedAt,
  }
}

function getBillingBreakdown(
  site: any,
  useCategory: 'planned_toal' | 'emergency_recovery',
  hasActiveSubscription: boolean,
) {
  const isEmergency = useCategory === 'emergency_recovery'
  const landownerFee = isEmergency
    ? site.clzAccessFee != null
      ? Number(site.clzAccessFee.toString())
      : 150
    : site.toalAccessFee != null
      ? Number(site.toalAccessFee.toString())
      : 0
  const platformFee = hasActiveSubscription ? 0 : isEmergency ? 0 : 5
  const totalDueNow = isEmergency ? 0 : landownerFee + platformFee

  return {
    billingMode: hasActiveSubscription ? 'subscription' : 'payg',
    landownerFee,
    platformFee,
    totalDueNow,
    authorizationAmount: isEmergency ? landownerFee : null,
    currency: site.currency || 'GBP',
    requiresCard: isEmergency || totalDueNow > 0,
  } as const
}

async function loadOperatorBillingContext(cognitoUser: CognitoUser) {
  const operator = await db.user.findUnique({
    where: { id: cognitoUser.sub },
    include: {
      subscription: {
        include: {
          plan: true,
        },
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

  return {
    operator,
    paymentMethods,
  }
}

function serializeSubscription(user: any) {
  const subscription = user.subscription
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

export async function getBookingCheckoutContextHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const siteId = c.req.param('siteId')
  const useCategory =
    c.req.query('useCategory') === 'emergency_recovery'
      ? 'emergency_recovery'
      : 'planned_toal'

  const { operator, paymentMethods } =
    await loadOperatorBillingContext(cognitoUser)

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

  const subscription = serializeSubscription(operator)
  const pricing = getBillingBreakdown(
    site,
    useCategory,
    subscription.hasActiveSubscription,
  )
  const defaultPaymentMethodId =
    paymentMethods.find((pm) => pm.isDefault)?.id ??
    paymentMethods[0]?.id ??
    null

  return sendResponse(c, {
    message: 'Booking checkout context fetched',
    data: {
      siteId: site.id,
      siteName: site.name,
      siteAddress: site.address,
      useCategory,
      subscription,
      pricing,
      paymentMethods: paymentMethods.map(serializePaymentMethod),
      defaultPaymentMethodId,
      selectedPaymentMethodId: defaultPaymentMethodId,
      requiresCard: pricing.requiresCard,
    },
  })
}

// Standard booking include query (used across multiple handlers)
const bookingInclude = {
  site: {
    select: {
      name: true,
      address: true,
      landownerId: true,
      siteType: true,
      siteCategory: true,
      geometryMetadata: true,
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
  certificates: {
    select: { id: true, vaId: true },
    take: 1,
  },
} as const

// ==========================================
// Handlers
// ==========================================

/**
 * GET /bookings/v1/availability/:siteId
 * Public (no auth) — returns anonymized booked/pending slots for a site.
 * Operators use this to see availability before or during booking.
 * Optional query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function getPublicSiteAvailabilityHandler(
  c: Context,
): Promise<Response> {
  const siteId = c.req.param('siteId')
  const fromParam = c.req.query('from')
  const toParam = c.req.query('to')

  // Validate siteId exists
  const site = await db.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      deletedAt: true,
      status: true,
      exclusiveUse: true,
    },
  })

  if (!site || site.deletedAt) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found',
      code: 'NOT_FOUND',
    })
  }

  // Build date range filter
  const now = new Date()
  const from = fromParam
    ? new Date(fromParam)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const to = toParam
    ? new Date(toParam)
    : new Date(from.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 day window by default

  const bookings = await db.booking.findMany({
    where: {
      siteId,
      status: { in: ['PENDING', 'APPROVED'] },
      startTime: { lt: to },
      endTime: { gt: from },
    },
    select: {
      startTime: true,
      endTime: true,
      status: true,
      useCategory: true,
    },
    orderBy: { startTime: 'asc' },
  })

  return sendResponse(c, {
    message: 'Site availability fetched',
    data: {
      siteId,
      siteName: site.name,
      exclusiveUse: site.exclusiveUse,
      slots: bookings.map((b) => ({
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        useCategory: b.useCategory,
      })),
    },
  })
}

/**
 * POST /sites/v1/bookings
 * Operator creates a new booking request.
 * - Checks operator is VERIFIED
 * - Checks active subscription (skips PAYG) OR schedules PAYG charging for booking date
 * - Auto-approves if site.autoApprove = true
 */
export async function createBookingHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const body = (c.req as any).valid('json') as z.infer<
    typeof createBookingSchema
  >

  const { operator, paymentMethods } =
    await loadOperatorBillingContext(cognitoUser)

  // 2. Fetch the site
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

  const bookingStart = new Date(body.startTime)
  const bookingEnd = new Date(body.endTime)
  const bookingStartDate = body.startTime.slice(0, 10)
  const bookingEndDate = body.endTime.slice(0, 10)
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

  const isEmergency = body.useCategory === 'emergency_recovery'
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

  const subscription = serializeSubscription(operator)
  const billing = getBillingBreakdown(
    site,
    body.useCategory,
    subscription.hasActiveSubscription,
  )
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

  // 4. Determine initial booking status
  const bookingStatus = site.autoApprove ? 'APPROVED' : 'PENDING'
  const bookingReference = generateBookingReference()
  const vaId = generateVAID('va-bkg')

  // 5. Create the booking + notifications in a transaction
  const booking = await db.$transaction(async (tx) => {
    const newBooking = await tx.booking.create({
      data: {
        operatorId: cognitoUser.sub,
        siteId: body.siteId,
        bookingReference,
        vaId,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        operationReference: body.operationReference || null,
        droneModel: body.droneModel,
        missionIntent: body.missionIntent,
        useCategory: body.useCategory as any,
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
        ...bookingInclude,
        site: { select: { name: true, address: true, landownerId: true } },
      },
    })

    // Notify operator
    const feeDisplay = billing.authorizationAmount
      ? `£${billing.authorizationAmount.toFixed(2)}`
      : '£150.00'
    await tx.notification.create({
      data: {
        userId: cognitoUser.sub,
        type: 'info',
        title:
          bookingStatus === 'APPROVED'
            ? 'Booking Confirmed'
            : 'Booking Submitted',
        message: isEmergency
          ? `Your Emergency Standby booking for "${site.name}" (${bookingReference}) is confirmed. ${feeDisplay} will only be charged if you confirm the site was used.`
          : bookingStatus === 'APPROVED' && isPayg
            ? `Your booking for "${site.name}" (${bookingReference}) has been automatically approved. Your card will be charged on the booking start date.`
            : bookingStatus === 'APPROVED'
              ? `Your booking for "${site.name}" (${bookingReference}) has been automatically approved.`
              : `Your booking request for "${site.name}" (${bookingReference}) has been submitted and is pending landowner approval.`,
        actionUrl: '/dashboard/operator',
        relatedEntityId: newBooking.id,
      },
    })

    // Notify landowner (only when not auto-approved — they already consented)
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

    // Auto-approve: always create a certificate immediately when booking is approved.
    if (bookingStatus === 'APPROVED') {
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
        const vaId = generateVAID('va-cert')
        await tx.consentCertificate.create({
          data: {
            bookingId: newBooking.id,
            vaId,
            issueDate: new Date(),
            verificationHash: hash,
            digitalSignature: `SIG_${hash.substring(0, 24)}`,
            verificationUrl: `https://vertiaccess.app/verify/${hash}`,
            siteStatusAtIssue: site.status,
          },
        })
      }
    }

    return newBooking
  })

  // Re-fetch with certificates included for proper serialization
  const bookingWithCert = await db.booking.findUnique({
    where: { id: booking.id },
    include: bookingInclude,
  })

  return sendCreatedResponse(
    c,
    serializeBooking(bookingWithCert),
    'Booking request submitted',
  )
}

/**
 * GET /sites/v1/bookings/mine
 * Operator fetches their own bookings.
 */
export async function listMyBookingsHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)

  const bookings = await db.booking.findMany({
    where: { operatorId: cognitoUser.sub },
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  })

  return sendResponse(c, {
    message: 'Bookings fetched',
    data: bookings.map(serializeBooking),
  })
}

/**
 * GET /sites/v1/bookings/site/:siteId
 * Landowner or Admin fetches all bookings for a specific site.
 */
export async function listSiteBookingsHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const siteId = c.req.param('siteId')
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

  // Verify ownership unless admin
  if (!isAdmin) {
    const site = await db.site.findUnique({ where: { id: siteId } })
    if (!site || site.deletedAt) {
      throw new AppError({
        statusCode: HTTPStatusCode.NOT_FOUND,
        message: 'Site not found',
        code: 'NOT_FOUND',
      })
    }
    if (site.landownerId !== cognitoUser.sub) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'Access denied',
        code: 'FORBIDDEN',
      })
    }
  }

  const bookings = await db.booking.findMany({
    where: { siteId },
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  })

  return sendResponse(c, {
    message: 'Site bookings fetched',
    data: bookings.map(serializeBooking),
  })
}

/**
 * GET /sites/v1/bookings/landowner
 * Landowner fetches all bookings across all their sites.
 */
export async function listLandownerBookingsHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

  // Find all siteIds owned by this landowner
  const ownedSites = await db.site.findMany({
    where: isAdmin
      ? { deletedAt: null }
      : { landownerId: cognitoUser.sub, deletedAt: null },
    select: { id: true },
  })

  const siteIds = ownedSites.map((s) => s.id)

  const bookings = await db.booking.findMany({
    where: { siteId: { in: siteIds } },
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  })

  return sendResponse(c, {
    message: 'Landowner bookings fetched',
    data: bookings.map(serializeBooking),
  })
}

/**
 * GET /sites/v1/bookings/:bookingId
 * Fetch a single booking by ID. Accessible by operator, site landowner, or admin.
 */
export async function getBookingHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const bookingId = c.req.param('bookingId')
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

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

  const isOperator = booking.operatorId === cognitoUser.sub
  const isLandowner = booking.site?.landownerId === cognitoUser.sub

  if (!isAdmin && !isOperator && !isLandowner) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Access denied',
      code: 'FORBIDDEN',
    })
  }

  return sendResponse(c, {
    message: 'Booking fetched',
    data: serializeBooking(booking),
  })
}

/**
 * GET /sites/v1/bookings/:bookingId/certificate
 * Fetch the consent certificate for an approved booking.
 * Returns enriched data including landowner + site details for frontend rendering.
 * Accessible by the booking operator, site landowner, or admin.
 */
export async function getBookingCertificateHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const bookingId = c.req.param('bookingId')
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      site: {
        select: {
          name: true,
          address: true,
          landownerId: true,
          siteType: true,
          geometryMetadata: true,
          status: true,
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
      certificates: {
        take: 1,
        orderBy: { issueDate: 'desc' },
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

  const isOperator = booking.operatorId === cognitoUser.sub
  const isLandowner = booking.site?.landownerId === cognitoUser.sub

  if (!isAdmin && !isOperator && !isLandowner) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Access denied',
      code: 'FORBIDDEN',
    })
  }

  const cert = booking.certificates[0]
  if (!cert) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message:
        'No consent certificate found for this booking. Booking may not be approved yet.',
      code: 'NOT_FOUND',
    })
  }

  // Fetch landowner profile for certificate display
  const landownerProfile = await db.landownerProfile.findUnique({
    where: { userId: booking.site?.landownerId ?? '' },
    select: { fullName: true, contactPhone: true },
  })

  const landownerUser = await db.user.findUnique({
    where: { id: booking.site?.landownerId ?? '' },
    select: { email: true },
  })

  const geometryMeta = (booking.site?.geometryMetadata as any) || {}

  const certificateData = {
    // Certificate identification
    id: cert.id,
    vaId: cert.vaId,
    certificateType: cert.certificateType,
    issueDate: cert.issueDate?.toISOString?.() || cert.issueDate,
    platformName: 'VertiAccess',
    verificationUrl: cert.verificationUrl,
    verificationHash: cert.verificationHash,
    digitalSignature: cert.digitalSignature,
    siteStatusAtIssue: cert.siteStatusAtIssue,

    // Landowner info
    landownerName: landownerProfile?.fullName || 'Landowner',
    landownerEmail: landownerUser?.email || '',
    landownerPhone: landownerProfile?.contactPhone || '',
    authorityDeclaration: true,

    // Site info
    siteId: booking.siteId,
    siteName: booking.site?.name || '',
    siteType: (booking.site?.siteType as any) || 'toal',
    siteAddress: booking.site?.address || '',
    siteGeometry: geometryMeta.geometry || null,
    clzGeometry: geometryMeta.clzGeometry || null,
    siteGeometrySize: geometryMeta.geometry?.radius
      ? `${geometryMeta.geometry.radius}m radius`
      : 'Polygon area',
    siteCoordinates: geometryMeta.geometry?.center
      ? `${geometryMeta.geometry.center.lat}°N, ${geometryMeta.geometry.center.lng}°W`
      : 'N/A',

    // Operator info
    operatorName: booking.operator?.operatorProfile?.fullName || '',
    operatorOrganisation:
      booking.operator?.operatorProfile?.organisation || null,
    operatorEmail: booking.operator?.email || '',
    operationReference: booking.bookingReference,
    flyerId: booking.operator?.operatorProfile?.flyerId || null,
    droneModel: booking.droneModel,
    missionIntent: booking.missionIntent,

    // Booking details
    startTime: booking.startTime?.toISOString?.() || booking.startTime,
    endTime: booking.endTime?.toISOString?.() || booking.endTime,
    permittedActivities: ['Take-off', 'Landing', 'Recovery'],
    useCategory: booking.useCategory,
    exclusiveUse: false,
    autoApprovalEnabled: false,
    consentStatus: booking.status,

    // Audit
    createdAt: cert.issueDate?.toISOString?.() || cert.issueDate,
    bookingId: booking.id,
    bookingVaId: booking.vaId,
  }

  return sendResponse(c, {
    message: 'Certificate fetched',
    data: certificateData,
  })
}

/**
 * PATCH /sites/v1/bookings/:bookingId/status
 * Update booking status:
 * - Landowner / Admin: APPROVED, REJECTED
 * - Operator: CANCELLED (own bookings only)
 */
export async function updateBookingStatusHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const bookingId = c.req.param('bookingId')
  const body = (c.req as any).valid('json') as z.infer<
    typeof updateBookingStatusSchema
  >
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
          operatorProfile: { select: { fullName: true, organisation: true } },
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

  // Access control
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

  // State transition guards
  if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: `Cannot update a ${booking.status} booking`,
      code: 'BAD_REQUEST',
    })
  }

  // Compute cancellation fee if applicable
  let cancellationFee: number | null = null
  let paymentStatus: string | null = null

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
        certificates: { select: { id: true, vaId: true }, take: 1 },
      },
    })

    // Create consent certificate whenever a booking is approved.
    if (body.status === 'APPROVED') {
      const existingCert = await tx.consentCertificate.findFirst({
        where: { bookingId },
        select: { id: true },
      })

      if (!existingCert) {
        const hash = generateVerificationHash(
          bookingId,
          booking.siteId,
          booking.operatorId,
        )
        const vaId = generateVAID('va-cert')
        await tx.consentCertificate.create({
          data: {
            bookingId: bookingId,
            vaId,
            issueDate: new Date(),
            verificationHash: hash,
            digitalSignature: `SIG_${hash.substring(0, 24)}`,
            verificationUrl: `https://vertiaccess.app/verify/${hash}`,
            siteStatusAtIssue: booking.site?.status || 'ACTIVE',
          },
        })
      }

      // Notify operator — approved & certificate ready
      await tx.notification.create({
        data: {
          userId: booking.operatorId,
          type: 'success',
          title: 'Booking Approved',
          message: `Your booking (${booking.bookingReference}) for "${booking.site?.name}" has been approved. Your consent certificate is ready.`,
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
      // Notify landowner
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

  // Re-fetch with fresh certificates to get the newly created vaId
  const finalBooking = await db.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  })

  return sendResponse(c, {
    message: `Booking ${body.status.toLowerCase()} successfully`,
    data: serializeBooking(finalBooking),
  })
}

/**
 * PATCH /bookings/v1/:bookingId/emergency-usage
 * Operator confirms whether an approved Emergency & Recovery booking was actually used.
 * If used=true: sets paymentStatus to pending_charge and triggers off-session charge.
 * If used=false: sets paymentStatus to cancelled_no_charge, no charge applied.
 */
export async function confirmEmergencyUsageHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const bookingId = c.req.param('bookingId')
  const body = (c.req as any).valid('json') as z.infer<
    typeof confirmEmergencyUsageSchema
  >

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

  // Guard against double-confirmation
  if (booking.clzConfirmedAt) {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Emergency usage has already been confirmed for this booking',
      code: 'BAD_REQUEST',
    })
  }

  const newPaymentStatus = body.used ? 'pending_charge' : 'cancelled_no_charge'

  const updated = await db.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        clzUsed: body.used,
        clzConfirmedAt: new Date(),
        paymentStatus: newPaymentStatus as any,
      },
      include: bookingInclude,
    })

    if (body.used) {
      // Notify operator: charge is being processed
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
      // Notify landowner: show "Processing Payout" — do NOT reveal card decline risk
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
      // Notify operator: no charge
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
      // Notify landowner: no payout
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

  // Fire-and-forget: trigger the off-session charge via the payment service internal endpoint.
  // The payment service handles lockout on failure asynchronously.
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

  return sendResponse(c, {
    message: body.used
      ? 'Emergency usage confirmed. Payment is being processed.'
      : 'Emergency usage marked as not used. No charge applied.',
    data: serializeBooking(updated),
  })
}
