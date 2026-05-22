import type { CognitoUser } from '@vertiaccess/core'
import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode } from '@vertiaccess/core'

export async function getBookingCertificate(
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
