// services/site-service/src/controllers/bookings.ts
import type { Context } from 'hono'
import { z } from 'zod'
import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  sendResponse,
  sendPaginatedResponse,
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

const bookingStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
])

const bookingBucketSchema = z.enum(['pending', 'upcoming', 'past'])

function parseListQuery(c: Context) {
  return z
    .object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(50).default(10),
      status: bookingStatusSchema.optional(),
      useCategory: z.enum(['planned_toal', 'emergency_recovery']).optional(),
      bucket: bookingBucketSchema.optional(),
      siteId: z.string().trim().min(1).optional(),
      search: z.string().trim().min(1).optional(),
    })
    .parse({
      page: c.req.query('page') ?? undefined,
      limit: c.req.query('limit') ?? undefined,
      status: c.req.query('status') ?? undefined,
      useCategory: c.req.query('useCategory') ?? undefined,
      bucket: c.req.query('bucket') ?? undefined,
      siteId: c.req.query('siteId') ?? undefined,
      search: c.req.query('search') ?? undefined,
    })
}

function buildSearchFilter(search: string | undefined) {
  if (!search) return undefined

  return {
    OR: [
      { bookingReference: { contains: search, mode: 'insensitive' as const } },
      {
        operationReference: { contains: search, mode: 'insensitive' as const },
      },
      { site: { name: { contains: search, mode: 'insensitive' as const } } },
      {
        operator: { email: { contains: search, mode: 'insensitive' as const } },
      },
      {
        operator: {
          operatorProfile: {
            fullName: { contains: search, mode: 'insensitive' as const },
          },
        },
      },
      {
        operator: {
          operatorProfile: {
            organisation: { contains: search, mode: 'insensitive' as const },
          },
        },
      },
    ],
  }
}

function buildBookingScopeWhere(
  siteIds: string[],
  query: ReturnType<typeof parseListQuery>,
) {
  const andConditions: Record<string, unknown>[] = [{ siteId: { in: siteIds } }]

  if (query.siteId) {
    andConditions.push({ siteId: query.siteId })
  }

  if (query.useCategory) {
    andConditions.push({ useCategory: query.useCategory })
  }

  if (query.status) {
    andConditions.push({ status: query.status })
  }

  if (query.bucket === 'pending') {
    andConditions.push({ status: 'PENDING' })
  }

  if (query.bucket === 'upcoming') {
    andConditions.push({ status: 'APPROVED', startTime: { gt: new Date() } })
  }

  if (query.bucket === 'past') {
    andConditions.push({
      OR: [
        { status: { in: ['REJECTED', 'CANCELLED', 'EXPIRED'] } },
        { status: 'APPROVED', startTime: { lte: new Date() } },
      ],
    })
  }

  const searchFilter = buildSearchFilter(query.search)
  if (searchFilter) {
    andConditions.push(searchFilter)
  }

  return andConditions.length === 1 ? andConditions[0] : { AND: andConditions }
}

function formatLifecycleTitle(eventType: string) {
  switch (eventType) {
    case 'BOOKING_CREATED':
      return 'Booking submitted'
    case 'BOOKING_APPROVED':
      return 'Booking approved'
    case 'BOOKING_REJECTED':
      return 'Booking rejected'
    case 'BOOKING_CANCELLED':
      return 'Booking canceled'
    case 'PAYMENT_CHARGED':
      return 'Payment charged'
    case 'PAYMENT_FAILED':
      return 'Payment failed'
    case 'REFUND_COMPLETED':
      return 'Refund completed'
    case 'REFUND_INITIATED':
      return 'Refund initiated'
    case 'EMERGENCY_USAGE_CONFIRMED':
      return 'Emergency usage confirmed'
    case 'EMERGENCY_NOT_USED':
      return 'Emergency usage cleared'
    case 'CERTIFICATE_ISSUED':
      return 'Consent certificate issued'
    default:
      return eventType
  }
}

function formatLifecycleDescription(event: any) {
  const metadata = event.metadata || {}

  switch (event.eventType) {
    case 'BOOKING_CREATED':
      return 'The booking request was submitted and is now in the lifecycle feed.'
    case 'BOOKING_APPROVED':
      return metadata.autoApproved
        ? 'The booking was approved automatically by the site rules.'
        : 'The booking was approved by a landowner or admin.'
    case 'BOOKING_REJECTED':
      return (
        metadata.adminNote ||
        'The booking was rejected by a landowner or admin.'
      )
    case 'BOOKING_CANCELLED':
      return metadata.cancellationFee
        ? `Cancellation fee recorded: £${Number(metadata.cancellationFee).toFixed(2)}.`
        : 'The operator canceled this booking.'
    case 'PAYMENT_CHARGED':
      return metadata.amount
        ? `Payment of £${Number(metadata.amount).toFixed(2)} was captured successfully.`
        : 'Payment was captured successfully.'
    case 'PAYMENT_FAILED':
      return metadata.amountDue
        ? `Payment of £${Number(metadata.amountDue).toFixed(2)} failed.`
        : 'A payment attempt failed.'
    case 'REFUND_COMPLETED':
      return metadata.amountRefunded
        ? `Refund of £${Number(metadata.amountRefunded).toFixed(2)} completed.`
        : 'Refund completed.'
    case 'REFUND_INITIATED':
      return 'A refund was initiated.'
    case 'EMERGENCY_USAGE_CONFIRMED':
      return 'The operator confirmed the emergency site was used and payment processing started.'
    case 'EMERGENCY_NOT_USED':
      return 'The operator confirmed the emergency site was not used and no charge was applied.'
    case 'CERTIFICATE_ISSUED':
      return 'The consent certificate was generated for this booking.'
    default:
      return null
  }
}

// ==========================================
// Handlers
// ==========================================

/**
 * GET /bookings/v1/availability/:siteId?date=YYYY-MM-DD
 * Public (no auth) — returns activation hours and booked slots for a specific date.
 * Optional fallback: ?from=YYYY-MM-DD&to=YYYY-MM-DD for a multi-day range.
 */
export async function getPublicSiteAvailabilityHandler(
  c: Context,
): Promise<Response> {
  const siteId = c.req.param('siteId')
  const dateParam = c.req.query('date') // single-day mode (used by calendar)
  const fromParam = c.req.query('from')
  const toParam = c.req.query('to')

  // Validate site exists
  const site = await db.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      deletedAt: true,
      status: true,
      exclusiveUse: true,
      geometryMetadata: true,
    },
  })

  if (!site || site.deletedAt) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found',
      code: 'NOT_FOUND',
    })
  }

  // Parse activation hours from site geometry metadata
  // Landowners set these when registering a site (e.g. "08:00" → "20:00")
  const geoMeta = (site.geometryMetadata as any) || {}
  const activationStartTime: string = geoMeta.activationStartTime ?? '08:00'
  const activationEndTime: string = geoMeta.activationEndTime ?? '20:00'

  // Build date filter — single day takes priority over range
  const now = new Date()
  let from: Date
  let to: Date

  if (dateParam) {
    // Single day: from 00:00 to 23:59:59 on that date
    from = new Date(`${dateParam}T00:00:00.000Z`)
    to = new Date(`${dateParam}T23:59:59.999Z`)
  } else {
    from = fromParam
      ? new Date(fromParam)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate())
    to = toParam
      ? new Date(toParam)
      : new Date(from.getTime() + 90 * 24 * 60 * 60 * 1000)
  }

  const bookings = await db.booking.findMany({
    where: {
      siteId,
      status: { in: ['PENDING', 'APPROVED'] as any },
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

  const existingBookings = bookings.map((b) => ({
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status,
    useCategory: b.useCategory,
  }))

  return sendResponse(c, {
    message: 'Site availability fetched',
    data: {
      siteId,
      siteName: site.name,
      exclusiveUse: site.exclusiveUse,
      // Activation window — tells the frontend which time range to render
      activationStartTime,
      activationEndTime,
      // All non-cancelled bookings that overlap the requested date/range
      existingBookings,
      // Legacy slots shape kept for backwards compat
      slots: existingBookings,
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

  // 1. Verify operator exists and is VERIFIED
  const operator = await db.user.findUnique({
    where: { id: cognitoUser.sub },
    include: {
      operatorProfile: true,
      subscription: { include: { plan: true } },
      paymentMethods: {
        where: { isDefault: true },
        take: 1,
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

  if (operator.status !== 'VERIFIED') {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Your account must be verified before booking a site',
      code: 'FORBIDDEN',
    })
  }

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

  // 3. Subscription / payment gate
  const sub = operator.subscription
  const hasActiveSubscription =
    sub?.status === 'ACTIVE' &&
    (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date())

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

  const accessFeePerSlot = site.toalAccessFee
    ? Number(site.toalAccessFee.toString())
    : 0
  const accessFeeTotal = accessFeePerSlot

  let isPayg = false
  let platformFee = 0
  let paymentMethodLast4: string | null = null
  let paymentMethodBrand: string | null = null
  const defaultCard = operator.paymentMethods[0] ?? null

  if (!defaultCard) {
    throw new AppError({
      statusCode: 402 as any,
      message:
        'Payment method required: add a default card before creating bookings.',
      code: 'PAYMENT_REQUIRED',
    })
  }

  paymentMethodLast4 = defaultCard.last4
  paymentMethodBrand = defaultCard.brand

  if (hasActiveSubscription) {
    // Condition A: active subscription — bypass per-booking fee
    isPayg = false
    platformFee = 0
  } else {
    // Condition B: no subscription — mark as PAYG and charge on booking date.
    isPayg = true
    platformFee = 5.0
  }

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
        platformFee: platformFee > 0 ? platformFee : null,
        toalCost: accessFeeTotal > 0 ? accessFeeTotal : null,
        paymentMethodLast4,
        paymentMethodBrand,
        status: bookingStatus as any,
        paymentStatus: isPayg ? 'pending' : null,
        respondedAt: bookingStatus === 'APPROVED' ? new Date() : null,
      },
      include: {
        ...bookingInclude,
        site: { select: { name: true, address: true, landownerId: true } },
      },
    })

    // Notify operator
    await tx.notification.create({
      data: {
        userId: cognitoUser.sub,
        type: 'info',
        title:
          bookingStatus === 'APPROVED'
            ? 'Booking Approved'
            : 'Booking Submitted',
        message:
          bookingStatus === 'APPROVED' && isPayg
            ? body.useCategory === 'emergency_recovery'
              ? `Your Emergency & Recovery booking for "${site.name}" (${bookingReference}) is approved. You will only be charged if you confirm the site was used.`
              : `Your booking for "${site.name}" (${bookingReference}) has been automatically approved. Your card will be charged on the booking start date.`
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
  const querySchema = z.object({
    status: z
      .enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'])
      .optional(),
    useCategory: z.enum(['planned_toal', 'emergency_recovery']).optional(),
  })

  const { status, useCategory } = querySchema.parse({
    status: c.req.query('status') ?? undefined,
    useCategory: c.req.query('useCategory') ?? undefined,
  })

  const where: Record<string, unknown> = { operatorId: cognitoUser.sub }

  if (status) {
    where.status = status
  }

  if (useCategory) {
    where.useCategory = useCategory
  }

  const bookings = await db.booking.findMany({
    where,
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
  const query = parseListQuery(c)

  // Find all siteIds owned by this landowner
  const ownedSites = await db.site.findMany({
    where: isAdmin
      ? { deletedAt: null }
      : { landownerId: cognitoUser.sub, deletedAt: null },
    select: { id: true },
  })

  const siteIds = ownedSites.map((s) => s.id)
  const baseWhere: Record<string, unknown> = {
    siteId: { in: siteIds },
  }

  if (query.siteId) {
    baseWhere.siteId = query.siteId
  }

  if (query.useCategory) {
    baseWhere.useCategory = query.useCategory
  }

  if (query.search) {
    Object.assign(baseWhere, buildSearchFilter(query.search))
  }

  const listWhere = buildBookingScopeWhere(siteIds, query)
  const page = query.page
  const limit = query.limit
  const skip = (page - 1) * limit

  const [bookings, total, pendingCount, upcomingCount, pastCount] =
    await Promise.all([
      db.booking.findMany({
        where: listWhere,
        include: bookingInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.booking.count({ where: listWhere }),
      db.booking.count({
        where: {
          ...baseWhere,
          status: 'PENDING',
        },
      }),
      db.booking.count({
        where: {
          ...baseWhere,
          status: 'APPROVED',
          startTime: { gt: new Date() },
        },
      }),
      db.booking.count({
        where: {
          ...baseWhere,
          OR: [
            { status: { in: ['REJECTED', 'CANCELLED', 'EXPIRED'] } },
            { status: 'APPROVED', startTime: { lte: new Date() } },
          ],
        },
      }),
    ])

  const totalPages = Math.ceil(total / limit)

  return sendPaginatedResponse(c, {
    message: 'Landowner bookings fetched',
    data: bookings.map(serializeBooking),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
    extraMeta: {
      counts: {
        pending: pendingCount,
        upcoming: upcomingCount,
        past: pastCount,
      },
    },
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
 * GET /booking-queries/v1/:bookingId/timeline
 * Returns the lifecycle history for a booking.
 */
export async function getBookingTimelineHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const bookingId = c.req.param('bookingId')
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      site: {
        select: { landownerId: true },
      },
      operator: {
        select: { id: true },
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

  const events = await db.bookingLifecycleEvent.findMany({
    where: { bookingId },
    orderBy: { createdAt: 'asc' },
  })

  return sendResponse(c, {
    message: 'Booking timeline fetched',
    data: {
      bookingId,
      events: events.map((event) => ({
        id: event.id,
        bookingId: event.bookingId,
        eventType: event.eventType,
        title: formatLifecycleTitle(event.eventType),
        description: formatLifecycleDescription(event),
        actorType: event.actorType,
        actorId: event.actorId,
        previousState: event.previousState,
        newState: event.newState,
        metadata: event.metadata,
        createdAt: event.createdAt.toISOString(),
      })),
    },
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

  const updated = await db.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        clzUsed: body.used,
        clzConfirmedAt: new Date(),
      },
      include: bookingInclude,
    })

    await tx.notification.create({
      data: {
        userId: booking.site?.landownerId,
        type: 'info',
        title: 'Emergency Usage Confirmed',
        message: body.used
          ? `Operator confirmed Emergency & Recovery usage for booking ${booking.bookingReference}.`
          : `Operator confirmed Emergency & Recovery booking ${booking.bookingReference} was not used.`,
        actionUrl: '/dashboard/landowner',
        relatedEntityId: bookingId,
      },
    })

    return updatedBooking
  })

  return sendResponse(c, {
    message: body.used
      ? 'Emergency usage confirmed. Payment can now be processed.'
      : 'Emergency usage marked as not used. No charge should be applied.',
    data: serializeBooking(updated),
  })
}
