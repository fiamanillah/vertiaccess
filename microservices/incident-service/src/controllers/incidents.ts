import type { Context } from 'hono'
import { z } from 'zod'
import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  sendCreatedResponse,
  sendResponse,
  type CognitoUser,
  generateVAID,
} from '@vertiaccess/core'
import {
  createIncidentDocumentSchema,
  createIncidentDecisionSchema,
  createIncidentMessageSchema,
  createIncidentSchema,
  updateIncidentStatusSchema,
} from '../schemas/incident.schema.ts'

type IncidentRecord = NonNullable<Awaited<ReturnType<typeof loadIncidentById>>>

function getCognitoUser(c: Context): CognitoUser {
  return c.get('cognitoUser') as CognitoUser
}

function mapRoleToDbRole(role: string): 'ADMIN' | 'OPERATOR' | 'LANDOWNER' {
  const normalized = (role || '').toUpperCase()

  if (normalized === 'ADMIN') return 'ADMIN'
  if (normalized === 'LANDOWNER') return 'LANDOWNER'
  return 'OPERATOR'
}

function isAdminUser(cognitoUser: CognitoUser): boolean {
  return (cognitoUser.role || '').toLowerCase() === 'admin'
}

function resolveUserDisplayName(user: any): string {
  if (!user) return 'Unknown'

  const profile = user.operatorProfile || user.landownerProfile
  return profile?.fullName || user.fullName || user.email || 'Unknown'
}

function resolveUserRole(user: any): 'admin' | 'operator' | 'landowner' {
  const normalized = (user?.role || '').toLowerCase()
  if (normalized === 'admin') return 'admin'
  if (normalized === 'landowner') return 'landowner'
  return 'operator'
}

function resolvePartyProfile(user: any) {
  if (!user) return null

  const profile = user.operatorProfile || user.landownerProfile || null

  return profile
    ? {
        id: profile.userId || user.id,
        name: profile.fullName || user.fullName || user.email || 'Unknown',
        email: user.email || '',
        phone: profile.contactPhone || '',
        role: resolveUserRole(user),
      }
    : {
        id: user.id,
        name: user.fullName || user.email || 'Unknown',
        email: user.email || '',
        phone: '',
        role: resolveUserRole(user),
      }
}

function getViewerMessageVisibility(
  cognitoUser: CognitoUser,
): 'reporter' | 'target' | 'internal' | 'admin' {
  const role = (cognitoUser.role || '').toLowerCase()
  if (role === 'admin') return 'admin'
  if (role === 'landowner') return 'target'
  return 'reporter'
}

function shouldRevealInitialSubmission(
  incident: any,
  viewerVisibility: 'reporter' | 'target' | 'internal' | 'admin',
  cognitoUser?: CognitoUser,
) {
  if (viewerVisibility === 'admin') return true
  if (cognitoUser?.sub && cognitoUser.sub === incident.reporterId) return true

  return (incident.messages || []).some(
    (message: any) => message.visibility === viewerVisibility,
  )
}

function resolveIncidentOppositeParty(
  incident: any,
): { id: string; role: 'OPERATOR' | 'LANDOWNER' } | null {
  if (incident.reporterId === incident.booking?.operatorId) {
    return incident.site?.landownerId
      ? { id: incident.site.landownerId, role: 'LANDOWNER' }
      : null
  }

  return incident.booking?.operatorId
    ? { id: incident.booking.operatorId, role: 'OPERATOR' }
    : null
}

function resolveIncidentStatus(
  status: string,
): 'action_required' | 'under_review' | 'resolved' {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'resolved'
  if (status === 'UNDER_REVIEW') return 'under_review'
  return 'action_required'
}

function extractDocumentName(fileKey: string): string {
  const rawName = fileKey.split('/').pop() || fileKey
  return decodeURIComponent(rawName.split('::')[0] || rawName)
}

function extractDocumentSize(fileKey: string): string {
  const sizePart = fileKey.split('::')[1]
  return sizePart ? decodeURIComponent(sizePart) : 'Unknown'
}

function buildDocumentFileKey(
  incidentId: string,
  fileName: string,
  fileSize?: string,
): string {
  const safeName = encodeURIComponent(fileName.trim().replace(/\s+/g, '-'))
  const sizePart = encodeURIComponent(fileSize || 'Unknown')
  return `${incidentId}/${safeName}::${sizePart}`
}

function serializeIncidentMessage(message: any) {
  return {
    id: message.id,
    role: resolveUserRole(message.sender),
    sender: resolveUserDisplayName(message.sender),
    text: message.messageText,
    visibility: message.visibility || 'reporter',
    timestamp: message.createdAt?.toISOString?.() || message.createdAt,
  }
}

function serializeIncidentDecision(incident: any) {
  if (!incident.decisionAction) return null

  return {
    action: incident.decisionAction,
    reason: incident.decisionReason,
    targetId: incident.decisionTargetId || null,
    targetRole: incident.decisionTargetRole || null,
    durationDays: incident.decisionDurationDays || null,
    decidedAt:
      incident.decisionAt?.toISOString?.() || incident.decisionAt || null,
    decidedBy: resolveUserDisplayName(incident.decisionUser),
    targetName: resolveUserDisplayName(incident.sanctionTarget),
  }
}

function serializeIncidentDocument(document: any) {
  return {
    id: document.id,
    name: document.fileName || extractDocumentName(document.fileKey),
    type: document.documentType || 'FILE',
    size: document.fileSize || extractDocumentSize(document.fileKey),
    url: document.fileKey,
    uploadedAt: document.uploadedAt?.toISOString?.() || document.uploadedAt,
    uploadedBy: resolveUserDisplayName(document.uploader),
    messageId: document.messageId || null,
  }
}

function serializeIncident(incident: any, cognitoUser?: CognitoUser) {
  const siteLandowner = incident.site?.landowner || null
  const reporter = incident.reporter || null
  const bookingOperator = incident.booking?.operator || null
  const reporterRole = resolveUserRole(reporter)
  const reporterName = resolveUserDisplayName(reporter)
  const targetRole = reporterRole === 'operator' ? 'landowner' : 'operator'
  const documents = incident.documents || []
  const viewerVisibility = cognitoUser
    ? getViewerMessageVisibility(cognitoUser)
    : 'admin'
  const revealInitialSubmission = shouldRevealInitialSubmission(
    incident,
    viewerVisibility,
    cognitoUser,
  )
  const serializedDocuments = documents.map(serializeIncidentDocument)
  const messages = (incident.messages || [])
    .filter(
      (message: any) =>
        viewerVisibility === 'admin' || message.visibility === viewerVisibility,
    )
    .map((message: any) => ({
      ...serializeIncidentMessage(message),
      attachments: serializedDocuments.filter(
        (doc: { messageId: string | null }) => doc.messageId === message.id,
      ),
    }))
  const reporterProfile = resolvePartyProfile(reporter)
  const targetUser =
    reporterRole === 'operator' ? siteLandowner : bookingOperator
  const targetProfile = resolvePartyProfile(targetUser)
  const initialAttachments = serializedDocuments.filter(
    (doc: { messageId: string | null }) => !doc.messageId,
  )
  const initialSubmission = {
    id: `${incident.id}-message-0`,
    role: reporterRole,
    sender: reporterName,
    text: incident.description,
    timestamp: incident.createdAt?.toISOString?.() || incident.createdAt,
    visibility: 'reporter' as const,
    attachments: initialAttachments,
  }

  return {
    id: incident.id,
    vaId: incident.vaId || null,
    bookingRef:
      incident.booking?.bookingReference ||
      incident.booking?.operationReference ||
      incident.booking?.vaId ||
      incident.bookingId ||
      '',
    landownerId: incident.site?.landownerId || null,
    landownerName: resolveUserDisplayName(siteLandowner),
    siteId: incident.siteId,
    siteName: incident.site?.name || '',
    bookingId: incident.bookingId || undefined,
    operatorId: incident.booking?.operatorId || null,
    operatorName:
      resolveUserDisplayName(bookingOperator) ||
      (reporterRole === 'operator' ? reporterName : undefined),
    reporterRole,
    targetRole,
    reporterProfile,
    targetProfile,
    type: incident.incidentType,
    category: incident.incidentType,
    description: incident.description,
    urgency: incident.urgency,
    priority:
      incident.urgency === 'critical'
        ? 'critical'
        : incident.urgency === 'high'
          ? 'high'
          : incident.urgency === 'medium'
            ? 'medium'
            : 'low',
    status: resolveIncidentStatus(incident.status),
    estimatedDamage: incident.estimatedDamage
      ? Number(incident.estimatedDamage.toString())
      : undefined,
    adminNotes: incident.adminNotes || undefined,
    decision: serializeIncidentDecision(incident),
    showInitialSubmission: revealInitialSubmission,
    messages:
      revealInitialSubmission && messages.length === 0
        ? [initialSubmission]
        : revealInitialSubmission
          ? [initialSubmission, ...messages]
          : messages,
    relatedDocumentation: serializedDocuments,
    createdAt: incident.createdAt?.toISOString?.() || incident.createdAt,
    updatedAt:
      incident.decisionAt?.toISOString?.() ||
      incident.resolvedAt?.toISOString?.() ||
      incident.createdAt?.toISOString?.() ||
      incident.createdAt,
    resolvedAt:
      incident.resolvedAt?.toISOString?.() || incident.resolvedAt || undefined,
    incidentDateTime:
      incident.incidentDateTime?.toISOString?.() ||
      incident.incidentDateTime ||
      undefined,
    insuranceNotified: incident.insuranceNotified,
    immediateActionTaken: incident.immediateActionTaken || undefined,
    reporterId: incident.reporterId,
    targetId:
      incident.reporterId === incident.booking?.operatorId
        ? incident.site?.landownerId || null
        : incident.booking?.operatorId || null,
  }
}

const incidentInclude = {
  site: {
    include: {
      landowner: {
        include: {
          operatorProfile: true,
          landownerProfile: true,
        },
      },
    },
  },
  reporter: {
    include: {
      operatorProfile: true,
      landownerProfile: true,
    },
  },
  booking: {
    include: {
      operator: {
        include: {
          operatorProfile: true,
          landownerProfile: true,
        },
      },
    },
  },
  decisionUser: {
    include: {
      operatorProfile: true,
      landownerProfile: true,
    },
  },
  sanctionTarget: {
    include: {
      operatorProfile: true,
      landownerProfile: true,
    },
  },
  documents: {
    include: {
      uploader: {
        include: {
          operatorProfile: true,
          landownerProfile: true,
        },
      },
    },
    orderBy: { uploadedAt: 'asc' },
  },
  messages: {
    include: {
      sender: {
        include: {
          operatorProfile: true,
          landownerProfile: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} as const

function incidentBookingInclude() {
  return {
    site: {
      include: {
        landowner: {
          include: {
            operatorProfile: true,
            landownerProfile: true,
          },
        },
      },
    },
    operator: {
      include: {
        operatorProfile: true,
        landownerProfile: true,
      },
    },
  } as const
}

async function resolveIncidentSiteFromBooking(booking: any) {
  if (!booking) return null

  return db.site.findUnique({
    where: { id: booking.siteId },
    include: {
      landowner: {
        include: {
          operatorProfile: true,
          landownerProfile: true,
        },
      },
    },
  })
}

async function ensureAuthenticatedUserExists(
  cognitoUser: CognitoUser,
): Promise<string> {
  const dbRole = mapRoleToDbRole(cognitoUser.role)

  const userById = await db.user.findUnique({
    where: { id: cognitoUser.sub },
    select: { id: true, email: true, role: true },
  })

  let effectiveUserId = cognitoUser.sub

  if (userById) {
    effectiveUserId = userById.id

    if (userById.role !== dbRole) {
      await db.user.update({
        where: { id: userById.id },
        data: { role: dbRole },
      })
    }
  } else {
    const userByEmail = await db.user.findUnique({
      where: { email: cognitoUser.email },
      select: { id: true, role: true },
    })

    if (userByEmail) {
      effectiveUserId = userByEmail.id

      if (userByEmail.role !== dbRole) {
        await db.user.update({
          where: { id: userByEmail.id },
          data: { role: dbRole },
        })
      }
    } else {
      await db.user.create({
        data: {
          id: cognitoUser.sub,
          email: cognitoUser.email,
          role: dbRole,
        },
      })
    }
  }

  if (dbRole === 'LANDOWNER') {
    const fullName =
      `${cognitoUser.firstName || ''} ${cognitoUser.lastName || ''}`.trim()
    await db.landownerProfile.upsert({
      where: { userId: effectiveUserId },
      create: {
        userId: effectiveUserId,
        vaId: generateVAID('va-lo'),
        fullName: fullName || cognitoUser.email,
        contactPhone:
          (cognitoUser as any).phone_number ||
          (cognitoUser as any).phoneNumber ||
          '',
      },
      update: {},
    })
  }

  if (dbRole === 'OPERATOR') {
    const fullName =
      `${cognitoUser.firstName || ''} ${cognitoUser.lastName || ''}`.trim()
    await db.operatorProfile.upsert({
      where: { userId: effectiveUserId },
      create: {
        userId: effectiveUserId,
        vaId: generateVAID('va-op'),
        fullName: fullName || cognitoUser.email,
        contactPhone:
          (cognitoUser as any).phone_number ||
          (cognitoUser as any).phoneNumber ||
          '',
        flyerId:
          (cognitoUser as any).flyerId ||
          `${effectiveUserId.slice(0, 8).toUpperCase()}`,
      },
      update: {},
    })
  }

  return effectiveUserId
}

async function loadIncidentById(incidentId: string) {
  return db.incident.findUnique({
    where: { id: incidentId },
    include: incidentInclude,
  })
}

function serializeIncidentForViewer(incident: any, cognitoUser: CognitoUser) {
  return serializeIncident(incident, cognitoUser)
}

async function assertIncidentAccess(
  incident: IncidentRecord | null,
  cognitoUser: CognitoUser,
) {
  if (!incident) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Incident not found',
      code: 'NOT_FOUND',
    })
  }

  if (isAdminUser(cognitoUser)) {
    return
  }

  const isReporter = incident.reporterId === cognitoUser.sub
  const isSiteOwner = incident.site?.landownerId === cognitoUser.sub

  if (!isReporter && !isSiteOwner) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'You do not have permission to access this incident',
      code: 'FORBIDDEN',
    })
  }
}

async function resolveNotificationRecipients(incident: any, senderId: string) {
  const recipientIds = new Set<string>()
  const adminUsers = await db.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, role: true },
  })

  return adminUsers.filter((adminUser) => adminUser.id !== senderId)
}

async function createIncidentNotifications(
  incident: any,
  senderId: string,
  title: string,
  message: string,
) {
  const recipients = await resolveNotificationRecipients(incident, senderId)

  await Promise.all(
    recipients.map((recipient) =>
      db.notification.create({
        data: {
          userId: recipient.id,
          type: recipient.role === 'ADMIN' ? 'warning' : 'info',
          title,
          message,
          actionUrl:
            recipient.role === 'ADMIN'
              ? '/dashboard/admin'
              : recipient.role === 'LANDOWNER'
                ? '/dashboard/landowner'
                : '/dashboard/operator',
          relatedEntityId: incident.id,
        },
      }),
    ),
  )
}

function resolveIncidentScopeWhere(cognitoUser: CognitoUser) {
  if (isAdminUser(cognitoUser)) {
    return {}
  }

  const role = (cognitoUser.role || '').toLowerCase()

  if (role === 'landowner') {
    return {
      site: {
        landownerId: cognitoUser.sub,
      },
    }
  }

  return {
    reporterId: cognitoUser.sub,
  }
}

export async function listIncidentsHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)

  await ensureAuthenticatedUserExists(cognitoUser)

  const incidents = await db.incident.findMany({
    where: resolveIncidentScopeWhere(cognitoUser),
    include: incidentInclude,
    orderBy: { createdAt: 'desc' },
  })

  return sendResponse(c, {
    message: 'Incidents retrieved successfully',
    data: incidents.map((incident) => serializeIncident(incident, cognitoUser)),
  })
}

export async function listMyIncidentsHandler(c: Context): Promise<Response> {
  return listIncidentsHandler(c)
}

export async function getIncidentHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const incidentId = c.req.param('incidentId')

  await ensureAuthenticatedUserExists(cognitoUser)

  const incident = await loadIncidentById(incidentId)
  await assertIncidentAccess(incident, cognitoUser)

  return sendResponse(c, {
    message: 'Incident retrieved successfully',
    data: serializeIncidentForViewer(incident, cognitoUser),
  })
}

export async function listSiteIncidentsHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const siteId = c.req.param('siteId')

  await ensureAuthenticatedUserExists(cognitoUser)

  const site = await db.site.findUnique({
    where: { id: siteId },
    select: { id: true, landownerId: true },
  })

  if (!site) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found',
      code: 'NOT_FOUND',
    })
  }

  if (!isAdminUser(cognitoUser) && site.landownerId !== cognitoUser.sub) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'You do not have permission to access this site',
      code: 'FORBIDDEN',
    })
  }

  const incidents = await db.incident.findMany({
    where: { siteId },
    include: incidentInclude,
    orderBy: { createdAt: 'desc' },
  })

  return sendResponse(c, {
    message: 'Site incidents retrieved successfully',
    data: incidents.map((incident) => serializeIncident(incident, cognitoUser)),
  })
}

export async function createIncidentHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const body = c.req.valid('json' as never) as z.infer<
    typeof createIncidentSchema
  >
  const pathBookingId = c.req.param('bookingId') || undefined

  const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser)
  const user = await db.user.findUnique({
    where: { id: effectiveUserId },
    include: {
      operatorProfile: true,
      landownerProfile: true,
    },
  })

  if (!user) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'User not found',
      code: 'NOT_FOUND',
    })
  }

  const role = (cognitoUser.role || '').toLowerCase()
  let booking = null as any

  const bookingIdentifier = (pathBookingId || body.bookingId || '').trim()

  if (bookingIdentifier) {
    booking = await db.booking.findUnique({
      where: { id: bookingIdentifier },
      include: incidentBookingInclude(),
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
        include: incidentBookingInclude(),
      })
    }

    if (!booking) {
      throw new AppError({
        statusCode: HTTPStatusCode.BAD_REQUEST,
        message: 'Booking not found',
        code: 'BAD_REQUEST',
      })
    }

    if (!isAdminUser(cognitoUser)) {
      if (role === 'operator' && booking.operatorId !== effectiveUserId) {
        throw new AppError({
          statusCode: HTTPStatusCode.FORBIDDEN,
          message: 'You can only report incidents for your own bookings',
          code: 'FORBIDDEN',
        })
      }

      if (
        role === 'landowner' &&
        booking.site?.landownerId !== effectiveUserId
      ) {
        throw new AppError({
          statusCode: HTTPStatusCode.FORBIDDEN,
          message: 'You can only report incidents on your own site',
          code: 'FORBIDDEN',
        })
      }
    }
  } else if (!isAdminUser(cognitoUser) && role === 'operator') {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Operators must link an incident to a booking',
      code: 'BAD_REQUEST',
    })
  }

  let site = null as any
  if (booking) {
    site = await resolveIncidentSiteFromBooking(booking)
  } else if (body.siteId) {
    site = await db.site.findUnique({
      where: { id: body.siteId },
      include: {
        landowner: {
          include: {
            operatorProfile: true,
            landownerProfile: true,
          },
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
    !isAdminUser(cognitoUser) &&
    role === 'landowner' &&
    site.landownerId !== effectiveUserId
  ) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'You can only report incidents on your own site',
      code: 'FORBIDDEN',
    })
  }

  const incident = await db.incident.create({
    data: {
      bookingId: booking?.id || null,
      siteId: site.id,
      reporterId: effectiveUserId,
      vaId: generateVAID('va-inc'),
      incidentType: body.type,
      urgency: body.urgency,
      description: body.description,
      incidentDateTime: body.incidentDateTime
        ? new Date(body.incidentDateTime)
        : null,
      estimatedDamage: body.estimatedDamage ?? null,
      immediateActionTaken: body.immediateActionTaken ?? null,
      insuranceNotified: body.insuranceNotified ?? false,
      status: body.status || (role === 'operator' ? 'UNDER_REVIEW' : 'OPEN'),
    },
    include: incidentInclude,
  })

  if (body.attachments?.length) {
    await db.incidentDocument.createMany({
      data: body.attachments.map((attachment) => ({
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

  const createdIncident = await loadIncidentById(incident.id)

  if (!createdIncident) {
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to load created incident',
      code: 'INTERNAL_SERVER_ERROR',
    })
  }

  const adminRecipients = await db.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, role: true },
  })

  await Promise.all(
    adminRecipients.map((recipient) =>
      db.notification.create({
        data: {
          userId: recipient.id,
          type: 'warning',
          title: 'New Incident Report',
          message: `A new incident report for "${site.name}" has been submitted.`,
          actionUrl: '/dashboard/admin/incident-report',
          relatedEntityId: createdIncident.id,
        },
      }),
    ),
  )

  return sendCreatedResponse(
    c,
    serializeIncidentForViewer(createdIncident, cognitoUser),
    'Incident report created',
  )
}

export async function updateIncidentStatusHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)

  if (!isAdminUser(cognitoUser)) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Only administrators can update incident status',
      code: 'FORBIDDEN',
    })
  }

  const incidentId = c.req.param('incidentId')
  const body = c.req.valid('json' as never) as z.infer<
    typeof updateIncidentStatusSchema
  >

  const incident = await loadIncidentById(incidentId)

  if (!incident) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Incident not found',
      code: 'NOT_FOUND',
    })
  }

  const resolvedAt =
    body.status === 'RESOLVED' || body.status === 'CLOSED' ? new Date() : null

  await db.incident.update({
    where: { id: incidentId },
    data: {
      status: body.status,
      adminNotes: body.adminNotes ?? incident.adminNotes,
      resolvedAt,
    },
  })

  const updatedIncident = await loadIncidentById(incidentId)

  if (!updatedIncident) {
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to load updated incident',
      code: 'INTERNAL_SERVER_ERROR',
    })
  }

  await createIncidentNotifications(
    updatedIncident,
    cognitoUser.sub,
    `Incident ${body.status.toLowerCase()}`,
    `Incident ${updatedIncident.id} is now marked as ${body.status.replace(/_/g, ' ').toLowerCase()}.`,
  )

  return sendResponse(c, {
    message: 'Incident status updated successfully',
    data: serializeIncidentForViewer(updatedIncident, cognitoUser),
  })
}

export async function updateIncidentAdminNotesHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)

  if (!isAdminUser(cognitoUser)) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Only administrators can update incident admin notes',
      code: 'FORBIDDEN',
    })
  }

  const incidentId = c.req.param('incidentId')
  const body = await c.req.json()
  const adminNotes = (body && body.adminNotes) || null

  const incident = await loadIncidentById(incidentId)

  if (!incident) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Incident not found',
      code: 'NOT_FOUND',
    })
  }

  await db.incident.update({
    where: { id: incidentId },
    data: {
      adminNotes,
    },
  })

  const updatedIncident = await loadIncidentById(incidentId)

  if (!updatedIncident) {
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to load updated incident',
      code: 'INTERNAL_SERVER_ERROR',
    })
  }

  await createIncidentNotifications(
    updatedIncident,
    cognitoUser.sub,
    'Incident Note Updated',
    `Admin note updated for incident ${updatedIncident.id}`,
  )

  return sendResponse(c, {
    message: 'Incident admin notes updated',
    data: serializeIncidentForViewer(updatedIncident, cognitoUser),
  })
}

export async function addIncidentMessageHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const incidentId = c.req.param('incidentId')
  const body = c.req.valid('json' as never) as z.infer<
    typeof createIncidentMessageSchema
  >

  const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser)
  const incident = await loadIncidentById(incidentId)
  await assertIncidentAccess(incident, cognitoUser)

  const role = (cognitoUser.role || '').toLowerCase()
  const visibility =
    body.visibility ||
    (role === 'admin'
      ? 'internal'
      : role === 'landowner'
        ? 'target'
        : 'reporter')

  if (visibility === 'internal' && !isAdminUser(cognitoUser)) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Only administrators can send internal incident messages',
      code: 'FORBIDDEN',
    })
  }

  const createdMessage = await db.incidentMessage.create({
    data: {
      incidentId,
      senderId: effectiveUserId,
      messageText: body.messageText,
      visibility,
    },
  })

  if (body.attachments?.length) {
    await db.incidentDocument.createMany({
      data: body.attachments.map((attachment) => ({
        incidentId,
        messageId: createdMessage.id,
        fileKey:
          attachment.fileKey ||
          buildDocumentFileKey(
            incidentId,
            attachment.fileName,
            attachment.fileSize,
          ),
        documentType: attachment.documentType || 'evidence',
        uploadedBy: effectiveUserId,
      })),
    })
  }

  const updatedIncident = await loadIncidentById(incidentId)

  if (!updatedIncident) {
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to load updated incident',
      code: 'INTERNAL_SERVER_ERROR',
    })
  }

  const adminRecipients = await db.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, role: true },
  })

  if (isAdminUser(cognitoUser) && visibility !== 'internal') {
    const oppositeParty = resolveIncidentOppositeParty(updatedIncident)
    const recipients = [
      ...adminRecipients,
      ...(oppositeParty ? [oppositeParty] : []),
    ].filter((recipient) => recipient.id !== effectiveUserId)

    await Promise.all(
      recipients.map((recipient) =>
        db.notification.create({
          data: {
            userId: recipient.id,
            type: recipient.role === 'ADMIN' ? 'warning' : 'info',
            title: 'Incident Message Added',
            message: `An admin message has been shared on incident ${updatedIncident.id}.`,
            actionUrl:
              recipient.role === 'ADMIN'
                ? '/dashboard/admin/incident-report'
                : recipient.role === 'LANDOWNER'
                  ? '/dashboard/landowner/incident-report'
                  : '/dashboard/operator/incident-report',
            relatedEntityId: updatedIncident.id,
          },
        }),
      ),
    )
  } else {
    await Promise.all(
      adminRecipients
        .filter((recipient) => recipient.id !== effectiveUserId)
        .map((recipient) =>
          db.notification.create({
            data: {
              userId: recipient.id,
              type: 'warning',
              title:
                visibility === 'internal'
                  ? 'Internal incident note'
                  : 'Incident Message Added',
              message:
                visibility === 'internal'
                  ? `An internal note has been added to incident ${updatedIncident.id}.`
                  : `A new message has been added to incident ${updatedIncident.id}.`,
              actionUrl: '/dashboard/admin/incident-report',
              relatedEntityId: updatedIncident.id,
            },
          }),
        ),
    )
  }

  return sendCreatedResponse(
    c,
    serializeIncidentForViewer(updatedIncident, cognitoUser),
    'Incident message added',
  )
}

export async function createIncidentDecisionHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)

  if (!isAdminUser(cognitoUser)) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Only administrators can record incident decisions',
      code: 'FORBIDDEN',
    })
  }

  const incidentId = c.req.param('incidentId')
  const body = c.req.valid('json' as never) as z.infer<
    typeof createIncidentDecisionSchema
  >

  const incident = await loadIncidentById(incidentId)
  if (!incident) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Incident not found',
      code: 'NOT_FOUND',
    })
  }

  const decisionTargetId = body.decisionTargetId || null
  const decisionTargetRole = body.decisionTargetRole || null

  if (
    (body.decisionAction === 'temporary_suspend' ||
      body.decisionAction === 'ban') &&
    !decisionTargetId
  ) {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Decision target is required for sanction actions',
      code: 'BAD_REQUEST',
    })
  }

  if (decisionTargetId && decisionTargetRole) {
    const target = await db.user.findUnique({
      where: { id: decisionTargetId },
      select: { id: true, role: true, status: true },
    })

    if (!target) {
      throw new AppError({
        statusCode: HTTPStatusCode.NOT_FOUND,
        message: 'Decision target not found',
        code: 'NOT_FOUND',
      })
    }

    const expectedRole =
      decisionTargetRole === 'landowner' ? 'LANDOWNER' : 'OPERATOR'
    if (target.role !== expectedRole) {
      throw new AppError({
        statusCode: HTTPStatusCode.BAD_REQUEST,
        message: 'Decision target role does not match the selected user',
        code: 'BAD_REQUEST',
      })
    }
  }

  const resolvedAt = body.decisionAction === 'no_action' ? null : new Date()

  await db.incident.update({
    where: { id: incidentId },
    data: {
      decisionAction: body.decisionAction,
      decisionReason: body.decisionReason,
      decisionTargetId,
      decisionTargetRole: decisionTargetRole
        ? decisionTargetRole === 'landowner'
          ? 'LANDOWNER'
          : 'OPERATOR'
        : null,
      decisionDurationDays: body.decisionDurationDays ?? null,
      decisionBy: cognitoUser.sub,
      decisionAt: resolvedAt,
      status:
        body.decisionAction === 'no_action' ? incident.status : 'RESOLVED',
      resolvedAt,
    },
  })

  if (
    body.decisionAction === 'temporary_suspend' ||
    body.decisionAction === 'ban'
  ) {
    await db.user.update({
      where: { id: decisionTargetId as string },
      data: {
        status: body.decisionAction === 'ban' ? 'BANNED' : 'SUSPENDED',
        suspendedAt: new Date(),
        suspendedReason:
          body.decisionAction === 'ban'
            ? body.decisionReason
            : body.decisionDurationDays
              ? `${body.decisionReason} (temporary suspension for ${body.decisionDurationDays} days)`
              : body.decisionReason,
      },
    })
  }

  const updatedIncident = await loadIncidentById(incidentId)
  if (!updatedIncident) {
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to load updated incident',
      code: 'INTERNAL_SERVER_ERROR',
    })
  }

  await createIncidentNotifications(
    updatedIncident,
    cognitoUser.sub,
    'Incident decision recorded',
    `Decision recorded for incident ${updatedIncident.id}`,
  )

  return sendResponse(c, {
    message: 'Incident decision recorded successfully',
    data: serializeIncidentForViewer(updatedIncident, cognitoUser),
  })
}

export async function addIncidentDocumentHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const incidentId = c.req.param('incidentId')
  const body = c.req.valid('json' as never) as z.infer<
    typeof createIncidentDocumentSchema
  >

  const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser)
  const incident = await loadIncidentById(incidentId)
  await assertIncidentAccess(incident, cognitoUser)

  await db.incidentDocument.create({
    data: {
      incidentId,
      fileKey:
        body.fileKey ||
        buildDocumentFileKey(incidentId, body.fileName, body.fileSize),
      documentType: body.documentType,
      uploadedBy: effectiveUserId,
    },
  })

  const updatedIncident = await loadIncidentById(incidentId)

  if (!updatedIncident) {
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to load updated incident',
      code: 'INTERNAL_SERVER_ERROR',
    })
  }

  await createIncidentNotifications(
    updatedIncident,
    effectiveUserId,
    'Incident Document Added',
    `A document has been attached to incident ${updatedIncident.id}.`,
  )

  return sendCreatedResponse(
    c,
    serializeIncidentForViewer(updatedIncident, cognitoUser),
    'Incident document added',
  )
}
