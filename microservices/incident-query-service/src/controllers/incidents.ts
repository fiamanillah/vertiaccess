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
    uploadedAt: document.uploadedAt?.toISOString?.() || document.uploadedAt,
    uploadedBy: resolveUserDisplayName(document.uploader),
  }
}

function serializeIncident(
  incident: any,
  viewerRole: 'admin' | 'operator' | 'landowner' = 'admin',
  viewerId?: string,
) {
  const siteLandowner = incident.site?.landowner || null
  const reporter = incident.reporter || null
  const bookingOperator = incident.booking?.operator || null
  const reporterRole = resolveUserRole(reporter)
  const reporterName = resolveUserDisplayName(reporter)
  const targetRole = reporterRole === 'operator' ? 'landowner' : 'operator'
  const isViewerReporter = viewerId ? incident.reporterId === viewerId : undefined
  const messages = (incident.messages || [])
    .filter((message: any) => {
      if (viewerRole === 'admin') return true
      if (message.visibility === 'internal') return false
      if (isViewerReporter === true) return message.visibility === 'reporter'
      if (isViewerReporter === false) return message.visibility === 'target'
      // Fallback to old role-based logic if viewerId not provided
      if (viewerRole === 'landowner') return message.visibility === 'target'
      return message.visibility === 'reporter'
    })
    .map(serializeIncidentMessage)

  const canSeeDescription = viewerRole === 'admin' || isViewerReporter === true || (isViewerReporter === undefined && viewerRole === reporterRole)

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
    type: incident.incidentType,
    category: incident.incidentType,
    description: canSeeDescription ? incident.description : 'This incident report is confidential and only visible to the reporter and admins.',
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
    messages:
      messages.length > 0
        ? messages
        : [
            {
              id: `${incident.id}-message-0`,
              role: reporterRole,
              sender: reporterName,
              text: canSeeDescription ? incident.description : 'This incident report is confidential and only visible to the reporter and admins.',
              timestamp:
                incident.createdAt?.toISOString?.() || incident.createdAt,
            },
          ],
    relatedDocumentation: (incident.documents || []).map(
      serializeIncidentDocument,
    ),
    createdAt: incident.createdAt?.toISOString?.() || incident.createdAt,
    updatedAt:
      incident.decisionAt?.toISOString?.() ||
      incident.resolvedAt?.toISOString?.() ||
      incident.resolvedAt ||
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

async function ensureAuthenticatedUserExists(
  cognitoUser: CognitoUser,
): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: cognitoUser.sub },
    select: { id: true },
  })

  if (!user) {
    throw new AppError({
      statusCode: HTTPStatusCode.UNAUTHORIZED,
      message:
        'User account not provisioned—please complete the sign-up process',
      code: 'USER_NOT_PROVISIONED',
    })
  }

  return user.id
}

async function loadIncidentById(incidentId: string) {
  return db.incident.findUnique({
    where: { id: incidentId },
    include: incidentInclude,
  })
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
  const reporterRole = incident.reporter?.role
  let targetId: string | null = null
  if (reporterRole === 'OPERATOR') {
    targetId = incident.site?.landownerId ?? null
  } else if (reporterRole === 'LANDOWNER') {
    targetId = incident.booking?.operatorId ?? null
  }
  const isTarget = targetId === cognitoUser.sub
  const isTargetInvolved =
    isTarget &&
    incident.messages.some((message: any) => message.visibility === 'target')

  if (!isReporter && !isTargetInvolved) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'You do not have permission to access this incident',
      code: 'FORBIDDEN',
    })
  }
}

async function resolveNotificationRecipients(incident: any, senderId: string) {
  const recipientIds = new Set<string>()
  recipientIds.add(incident.reporterId)

  if (incident.site?.landownerId) {
    recipientIds.add(incident.site.landownerId)
  }

  if (incident.booking?.operatorId) {
    recipientIds.add(incident.booking.operatorId)
  }

  const adminUsers = await db.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, role: true },
  })

  adminUsers.forEach((admin) => recipientIds.add(admin.id))

  recipientIds.delete(senderId)

  return db.user.findMany({
    where: { id: { in: [...recipientIds] } },
    select: { id: true, role: true },
  })
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

function resolveViewerRole(
  cognitoUser: CognitoUser,
): 'admin' | 'operator' | 'landowner' {
  if (isAdminUser(cognitoUser)) return 'admin'
  return (cognitoUser.role || '').toLowerCase() === 'landowner'
    ? 'landowner'
    : 'operator'
}

function resolveIncidentScopeWhere(cognitoUser: CognitoUser) {
  if (isAdminUser(cognitoUser)) {
    return {}
  }

  const role = (cognitoUser.role || '').toLowerCase()
  const targetMessageVisibility = 'target' as const

  if (role === 'landowner') {
    return {
      OR: [
        { reporterId: cognitoUser.sub },
        {
          site: { landownerId: cognitoUser.sub },
          reporterId: { not: cognitoUser.sub },
          messages: { some: { visibility: targetMessageVisibility } },
        },
      ],
    }
  }

  return {
    OR: [
      { reporterId: cognitoUser.sub },
      {
        booking: { operatorId: cognitoUser.sub },
        reporterId: { not: cognitoUser.sub },
        messages: { some: { visibility: targetMessageVisibility } },
      },
    ],
  }
}

export async function listIncidentsHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const viewerRole = resolveViewerRole(cognitoUser)

  await ensureAuthenticatedUserExists(cognitoUser)

  const incidents = await db.incident.findMany({
    where: resolveIncidentScopeWhere(cognitoUser),
    include: incidentInclude,
    orderBy: { createdAt: 'desc' },
  })

  return sendResponse(c, {
    message: 'Incidents retrieved successfully',
    data: incidents.map((incident) => serializeIncident(incident, viewerRole, cognitoUser.sub)),
  })
}

export async function listMyIncidentsHandler(c: Context): Promise<Response> {
  return listIncidentsHandler(c)
}

export async function getIncidentHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const incidentId = c.req.param('incidentId')
  const viewerRole = resolveViewerRole(cognitoUser)

  await ensureAuthenticatedUserExists(cognitoUser)

  const incident = await loadIncidentById(incidentId)
  await assertIncidentAccess(incident, cognitoUser)

  return sendResponse(c, {
    message: 'Incident retrieved successfully',
    data: serializeIncident(incident, viewerRole, cognitoUser.sub),
  })
}

export async function listSiteIncidentsHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const siteId = c.req.param('siteId')
  const viewerRole = resolveViewerRole(cognitoUser)

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
    data: incidents.map((incident) => serializeIncident(incident, viewerRole, cognitoUser.sub)),
  })
}

export async function listBookingIncidentsHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const bookingId = c.req.param('bookingId')
  const viewerRole = resolveViewerRole(cognitoUser)

  await ensureAuthenticatedUserExists(cognitoUser)

  const booking = await db.booking.findFirst({
    where: {
      OR: [
        { id: bookingId },
        { operationReference: bookingId },
        { bookingReference: bookingId },
        { vaId: bookingId },
      ],
    },
    select: {
      id: true,
      siteId: true,
      operatorId: true,
      site: {
        select: {
          landownerId: true,
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

  if (!isAdminUser(cognitoUser)) {
    const role = (cognitoUser.role || '').toLowerCase()
    if (role === 'operator' && booking.operatorId !== cognitoUser.sub) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'You can only access incidents for your own bookings',
        code: 'FORBIDDEN',
      })
    }
    if (role === 'landowner' && booking.site?.landownerId !== cognitoUser.sub) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'You can only access incidents on your own site',
        code: 'FORBIDDEN',
      })
    }
  }

  const incidents = await db.incident.findMany({
    where: { bookingId: booking.id },
    include: incidentInclude,
    orderBy: { createdAt: 'desc' },
  })

  return sendResponse(c, {
    message: 'Booking incidents retrieved successfully',
    data: incidents.map((incident) => serializeIncident(incident, viewerRole, cognitoUser.sub)),
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
  const viewerRole: 'admin' | 'operator' | 'landowner' =
    role === 'admin' ? 'admin' : role === 'landowner' ? 'landowner' : 'operator'
  const clientRequestId = (body.clientRequestId || '').trim() || null
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
    site = await db.site.findUnique({
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
      return sendCreatedResponse(
        c,
        serializeIncident(existingIncident, viewerRole, cognitoUser.sub),
        'Incident report created',
      )
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
      return sendCreatedResponse(
        c,
        serializeIncident(duplicateIncident, viewerRole, cognitoUser.sub),
        'Incident report created',
      )
    }

    throw error
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
    serializeIncident(createdIncident, viewerRole, cognitoUser.sub),
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
    data: serializeIncident(updatedIncident, 'admin', cognitoUser.sub),
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
    data: serializeIncident(updatedIncident, 'admin', cognitoUser.sub),
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
  const viewerRole: 'admin' | 'operator' | 'landowner' =
    role === 'admin' ? 'admin' : role === 'landowner' ? 'landowner' : 'operator'
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

  await db.incidentMessage.create({
    data: {
      incidentId,
      senderId: effectiveUserId,
      messageText: body.messageText,
      visibility,
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
    'Incident Message Added',
    `A new message has been added to incident ${updatedIncident.id}.`,
  )

  return sendCreatedResponse(
    c,
    serializeIncident(updatedIncident, viewerRole, cognitoUser.sub),
    'Incident message added',
  )
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

  const viewerRole: 'admin' | 'operator' | 'landowner' = isAdminUser(
    cognitoUser,
  )
    ? 'admin'
    : (cognitoUser.role || '').toLowerCase() === 'landowner'
      ? 'landowner'
      : 'operator'

  return sendCreatedResponse(
    c,
    serializeIncident(updatedIncident, viewerRole, cognitoUser.sub),
    'Incident document added',
  )
}
