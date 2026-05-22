import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  generateVAID,
  type CognitoUser,
} from '@vertiaccess/core'

// ------- helpers -------
function generateBookingReference(): string {
  const chars = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `VA-BKG-${chars.padEnd(8, 'X').substring(0, 8)}`
}

function generateVerificationHash(
  bookingId: string,
  siteId: string,
  operatorId: string,
): string {
  const raw = `${bookingId}:${siteId}:${operatorId}:${Date.now()}`
  return Buffer.from(raw).toString('base64url')
}

interface BillingBreakdown {
  billingMode: 'subscription' | 'payg'
  landownerFee: number
  platformFee: number
  totalDueNow: number
  authorizationAmount: number | null
  currency: string
  requiresCard: boolean
}

// ------- service class -------

export class BookingsService {
  // Common include used across queries
  private static readonly bookingInclude = {
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

  // ---------- availability ----------

  static async getSiteAvailability(
    siteId: string,
    from?: string,
    to?: string,
  ) {
    const site = await db.site.findUnique({
      where: { id: siteId },
      select: { id: true, name: true, deletedAt: true, status: true, exclusiveUse: true },
    })

    if (!site || site.deletedAt) {
      throw new AppError({
        statusCode: HTTPStatusCode.NOT_FOUND,
        message: 'Site not found',
        code: 'NOT_FOUND',
      })
    }

    const now = new Date()
    const startDate = from
      ? new Date(from)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endDate = to
      ? new Date(to)
      : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000)

    const bookings = await db.booking.findMany({
      where: {
        siteId,
        status: { in: ['PENDING', 'APPROVED'] },
        startTime: { lt: endDate },
        endTime: { gt: startDate },
      },
      select: { startTime: true, endTime: true, status: true, useCategory: true },
      orderBy: { startTime: 'asc' },
    })

    return {
      siteId,
      siteName: site.name,
      exclusiveUse: site.exclusiveUse,
      slots: bookings.map((b) => ({
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        useCategory: b.useCategory,
      })),
    }
  }

  // ---------- checkout context ----------

  static async getCheckoutContext(
    cognitoUser: CognitoUser,
    siteId: string,
    useCategory: 'planned_toal' | 'emergency_recovery',
  ) {
    const { operator, paymentMethods } = await this.loadOperatorBillingContext(cognitoUser)

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

    const pricing = this.getBillingBreakdown(site, useCategory, hasActiveSubscription)
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

  // ---------- create booking ----------

  static async createBooking(cognitoUser: CognitoUser, body: any) {
    const { operator, paymentMethods } = await this.loadOperatorBillingContext(cognitoUser)

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
      site.clzEnabled || site.siteType === 'emergency' || site.clzAccessFee != null,
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

    const billing = this.getBillingBreakdown(site, useCategory, hasActiveSubscription)

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
              ? `Your booking for "${site.name}" (${bookingReference}) has been automatically approved. Your card will be charged on the booking start date.`
              : bookingStatus === 'APPROVED'
                ? `Your booking for "${site.name}" (${bookingReference}) has been automatically approved.`
                : `Your booking request for "${site.name}" (${bookingReference}) has been submitted and is pending landowner approval.`,
          actionUrl: '/dashboard/operator',
          relatedEntityId: newBooking.id,
        },
      })

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
        }
      }

      return newBooking
    })

    // refetch with full includes for serialization
    const booking = await db.booking.findUnique({
      where: { id: created.id },
      include: this.bookingInclude,
    })

    if (!booking) {
      throw new AppError({
        statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
        message: 'Booking could not be loaded after creation',
        code: 'INTERNAL_ERROR',
      })
    }

    return booking
  }

  // ---------- list bookings ----------

  static async listMyBookings(cognitoUser: CognitoUser) {
    return db.booking.findMany({
      where: { operatorId: cognitoUser.sub },
      include: this.bookingInclude,
      orderBy: { createdAt: 'desc' },
    })
  }

  static async listSiteBookings(cognitoUser: CognitoUser, siteId: string) {
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

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

    return db.booking.findMany({
      where: { siteId },
      include: this.bookingInclude,
      orderBy: { createdAt: 'desc' },
    })
  }

  static async listLandownerBookings(cognitoUser: CognitoUser) {
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

    const ownedSites = await db.site.findMany({
      where: isAdmin
        ? { deletedAt: null }
        : { landownerId: cognitoUser.sub, deletedAt: null },
      select: { id: true },
    })

    const siteIds = ownedSites.map((s) => s.id)

    return db.booking.findMany({
      where: { siteId: { in: siteIds } },
      include: this.bookingInclude,
      orderBy: { createdAt: 'desc' },
    })
  }

  // ---------- get single booking ----------

  static async getBooking(cognitoUser: CognitoUser, bookingId: string) {
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: this.bookingInclude,
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

    return booking
  }

  // ---------- certificate ----------

  static async getBookingCertificate(
    cognitoUser: CognitoUser,
    bookingId: string,
  ) {
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

    const landownerProfile = await db.landownerProfile.findUnique({
      where: { userId: booking.site?.landownerId ?? '' },
      select: { fullName: true, contactPhone: true },
    })

    const landownerUser = await db.user.findUnique({
      where: { id: booking.site?.landownerId ?? '' },
      select: { email: true },
    })

    const geometryMeta = (booking.site?.geometryMetadata as any) || {}

    return {
      id: cert.id,
      vaId: cert.vaId,
      certificateType: cert.certificateType,
      issueDate: cert.issueDate?.toISOString?.() || cert.issueDate,
      platformName: 'VertiAccess',
      verificationUrl: cert.verificationUrl,
      verificationHash: cert.verificationHash,
      digitalSignature: cert.digitalSignature,
      siteStatusAtIssue: cert.siteStatusAtIssue,
      landownerName: landownerProfile?.fullName || 'Landowner',
      landownerEmail: landownerUser?.email || '',
      landownerPhone: landownerProfile?.contactPhone || '',
      authorityDeclaration: true,
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
      operatorName:
        booking.operator?.operatorProfile?.fullName || '',
      operatorOrganisation:
        booking.operator?.operatorProfile?.organisation || null,
      operatorEmail: booking.operator?.email || '',
      operationReference: booking.bookingReference,
      flyerId: booking.operator?.operatorProfile?.flyerId || null,
      droneModel: booking.droneModel,
      missionIntent: booking.missionIntent,
      startTime:
        booking.startTime?.toISOString?.() || booking.startTime,
      endTime:
        booking.endTime?.toISOString?.() || booking.endTime,
      permittedActivities: ['Take-off', 'Landing', 'Recovery'],
      useCategory: booking.useCategory,
      exclusiveUse: false,
      autoApprovalEnabled: false,
      consentStatus: booking.status,
      createdAt:
        cert.issueDate?.toISOString?.() || cert.issueDate,
      bookingId: booking.id,
      bookingVaId: booking.vaId,
    }
  }

  // ---------- update status ----------

  static async updateBookingStatus(
    cognitoUser: CognitoUser,
    bookingId: string,
    body: any,
  ) {
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
            operatorProfile: {
              select: { fullName: true, organisation: true },
            },
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
          message:
            'Only the landowner or admin can approve or reject bookings',
          code: 'FORBIDDEN',
        })
      }
    }

    if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
      throw new AppError({
        statusCode: HTTPStatusCode.BAD_REQUEST,
        message: `Cannot update a ${booking.status} booking`,
        code: 'BAD_REQUEST',
      })
    }

    let cancellationFee: number | null = null
    let paymentStatus: string | null = null

    if (body.status === 'CANCELLED') {
      const feePercentage = booking.site?.cancellationFeePercentage
        ? Number(booking.site.cancellationFeePercentage.toString())
        : 0
      const baseCost = booking.toalCost
        ? Number(booking.toalCost.toString())
        : 0
      const hoursUntilStart =
        (new Date(booking.startTime).getTime() - Date.now()) /
        (1000 * 60 * 60)

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
          cancelledAt:
            body.status === 'CANCELLED' ? new Date() : undefined,
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
          const certVaId = generateVAID('va-cert')
          await tx.consentCertificate.create({
            data: {
              bookingId,
              vaId: certVaId,
              issueDate: new Date(),
              verificationHash: hash,
              digitalSignature: `SIG_${hash.substring(0, 24)}`,
              verificationUrl: `https://vertiaccess.app/verify/${hash}`,
              siteStatusAtIssue: booking.site?.status || 'ACTIVE',
            },
          })
        }

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

    const finalBooking = await db.booking.findUnique({
      where: { id: bookingId },
      include: this.bookingInclude,
    })

    if (!finalBooking) {
      throw new AppError({
        statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
        message: 'Booking could not be loaded after status update',
        code: 'INTERNAL_ERROR',
      })
    }

    return finalBooking
  }

  // ---------- confirm emergency usage ----------

  static async confirmEmergencyUsage(
    cognitoUser: CognitoUser,
    bookingId: string,
    body: any,
  ) {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: this.bookingInclude,
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
        message:
          'Usage can only be confirmed after the operation window ends',
        code: 'BAD_REQUEST',
      })
    }

    if (booking.clzConfirmedAt) {
      throw new AppError({
        statusCode: HTTPStatusCode.BAD_REQUEST,
        message:
          'Emergency usage has already been confirmed for this booking',
        code: 'BAD_REQUEST',
      })
    }

    const newPaymentStatus = body.used
      ? 'pending_charge'
      : 'cancelled_no_charge'

    const updated = await db.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          clzUsed: body.used,
          clzConfirmedAt: new Date(),
          paymentStatus: newPaymentStatus as any,
        },
        include: this.bookingInclude,
      })

      if (body.used) {
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

    // fire-and-forget: trigger off-session charge via internal endpoint
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

    return updated
  }

  // ==================== private helpers ====================

  private static async loadOperatorBillingContext(cognitoUser: CognitoUser) {
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

  private static getBillingBreakdown(
    site: any,
    useCategory: 'planned_toal' | 'emergency_recovery',
    hasActiveSubscription: boolean,
  ): BillingBreakdown {
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
    }
  }
}
