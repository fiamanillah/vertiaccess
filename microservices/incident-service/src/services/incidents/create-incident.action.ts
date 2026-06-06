import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  generateVAID,
  type CognitoUser,
} from '@vertiaccess/core'
import { ensureAuthenticatedUserExists } from './ensure-user.action'
import {
  buildDocumentFileKey,
  incidentInclude,
  serializeIncident,
} from './helpers'
import { createIncidentNotifications } from './notifications.service'

export async function createIncidentAction(
  cognitoUser: CognitoUser,
  body: any,
  pathBookingId?: string,
) {
  const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser)
  const role = (cognitoUser.role || '').toLowerCase()
  const isAdmin = role === 'admin'
  const viewerRole: 'admin' | 'operator' | 'assetmanager' = isAdmin
    ? 'admin'
    : role === 'assetmanager'
      ? 'assetmanager'
      : 'operator'
  const clientRequestId = (body.clientRequestId || '').trim() || null

  const bookingIdentifier = (pathBookingId || body.bookingId || '').trim()

  let booking: any = null
  if (bookingIdentifier) {
    booking = await db.booking.findUnique({
      where: { id: bookingIdentifier },
      include: {
        site: {
          include: {
            assetManager: {
              include: { operatorProfile: true, assetManagerProfile: true },
            },
          },
        },
        operator: {
          include: { operatorProfile: true, assetManagerProfile: true },
        },
      },
    })

    if (!booking) {
      booking = await db.booking.findFirst({
        where: {
          OR: [
            { operationReference: bookingIdentifier },
            { bookingReference: bookingIdentifier },
            { vaId: bookingIdentifier },
          ],
        },
        include: {
          site: {
            include: {
              assetManager: {
                include: { operatorProfile: true, assetManagerProfile: true },
              },
            },
          },
          operator: {
            include: { operatorProfile: true, assetManagerProfile: true },
          },
        },
      })
    }

    if (!booking) {
      throw new AppError({
        statusCode: HTTPStatusCode.BAD_REQUEST,
        message: 'Booking not found',
        code: 'BAD_REQUEST',
      })
    }

    const site = await db.site.findUnique({
      where: { id: booking.siteId },
      include: {
        assetManager: {
          include: { operatorProfile: true, assetManagerProfile: true },
        },
      },
    })

    if (!site || site.deletedAt) {
      throw new AppError({
        statusCode: HTTPStatusCode.NOT_FOUND,
        message: 'Site not found',
        code: 'NOT_FOUND',
      })
    }

    if (!isAdmin) {
      if (role === 'operator' && booking.operatorId !== effectiveUserId) {
        throw new AppError({
          statusCode: HTTPStatusCode.FORBIDDEN,
          message: 'You can only report incidents for your own bookings',
          code: 'FORBIDDEN',
        })
      }
      if (role === 'assetmanager' && site.assetManagerId !== effectiveUserId) {
        throw new AppError({
          statusCode: HTTPStatusCode.FORBIDDEN,
          message: 'You can only report incidents on your own site',
          code: 'FORBIDDEN',
        })
      }
    }
  } else {
    if (!isAdmin && role === 'operator') {
      throw new AppError({
        statusCode: HTTPStatusCode.BAD_REQUEST,
        message: 'Operators must link an incident to a booking',
        code: 'BAD_REQUEST',
      })
    }
  }

  let site: any = null
  if (booking) {
    site = await db.site.findUnique({
      where: { id: booking.siteId },
      include: {
        assetManager: {
          include: { operatorProfile: true, assetManagerProfile: true },
        },
      },
    })
  } else if (body.siteId) {
    site = await db.site.findUnique({
      where: { id: body.siteId },
      include: {
        assetManager: {
          include: { operatorProfile: true, assetManagerProfile: true },
        },
      },
    })
  }

  if (!site || site.deletedAt) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found',
      code: 'NOT_FOUND',
    })
  }

  if (booking && booking.siteId !== site.id) {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Booking does not belong to the selected site',
      code: 'BAD_REQUEST',
    })
  }

  if (
    !booking &&
    !isAdmin &&
    role === 'assetmanager' &&
    site.assetManagerId !== effectiveUserId
  ) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'You can only report incidents on your own site',
      code: 'FORBIDDEN',
    })
  }

  const createData = {
    bookingId: booking?.id || null,
    siteId: site.id,
    reporterId: effectiveUserId,
    vaId: generateVAID('va-inc'),
    clientRequestId,
    incidentType: body.type,
    urgency: body.urgency,
    description: body.description,
    incidentDateTime: body.incidentDateTime
      ? new Date(body.incidentDateTime)
      : null,
    estimatedDamage: body.estimatedDamage ?? null,
    impactAssessment: body.impactAssessment || null,
    immediateActionTaken: body.immediateActionTaken ?? null,
    insuranceNotified: body.insuranceNotified ?? false,
    status: body.status || (role === 'operator' ? 'UNDER_REVIEW' : 'OPEN'),
  }

  if (clientRequestId) {
    const existingIncident = await db.incident.findUnique({
      where: { clientRequestId },
      include: incidentInclude,
    })

    if (existingIncident) {
      return serializeIncident(existingIncident, viewerRole, effectiveUserId)
    }
  }

  let incident
  try {
    incident = await db.incident.create({
      data: createData,
      include: incidentInclude,
    })
  } catch (error: any) {
    if (error?.code !== 'P2002' || !clientRequestId) {
      throw error
    }

    const duplicateIncident = await db.incident.findUnique({
      where: { clientRequestId },
      include: incidentInclude,
    })

    if (duplicateIncident) {
      return serializeIncident(duplicateIncident, viewerRole, effectiveUserId)
    }

    throw error
  }

  if (body.attachments?.length) {
    await db.incidentDocument.createMany({
      data: body.attachments.map((attachment: any) => ({
        incidentId: incident.id,
        fileKey:
          attachment.fileKey ||
          buildDocumentFileKey(
            incident.id,
            attachment.fileName,
            attachment.fileSize,
          ),
        documentType: attachment.documentType || 'evidence',
        uploadedBy: effectiveUserId,
        messageId: null,
      })),
    })
  }

  const createdIncident = await db.incident.findUnique({
    where: { id: incident.id },
    include: incidentInclude,
  })

  if (!createdIncident) {
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to load created incident',
      code: 'INTERNAL_SERVER_ERROR',
    })
  }

  await createIncidentNotifications(
    createdIncident,
    effectiveUserId,
    'New Incident Report',
    `A new incident report for "${site.name}" has been submitted.`,
  )

  return serializeIncident(createdIncident, viewerRole, effectiveUserId)
}
