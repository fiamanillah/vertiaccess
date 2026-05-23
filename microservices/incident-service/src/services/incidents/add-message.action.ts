import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode, type CognitoUser } from '@vertiaccess/core'
import { ensureAuthenticatedUserExists } from './ensure-user.action'
import {
  buildDocumentFileKey,
  incidentInclude,
  serializeIncident,
  serializeIncidentDocument,
  resolveUserDisplayName,
} from './helpers'
import { createIncidentNotifications } from './notifications.service'

export async function addIncidentMessageAction(
  cognitoUser: CognitoUser,
  incidentId: string,
  body: any,
) {
  const effectiveUserId = await ensureAuthenticatedUserExists(cognitoUser)
  const incident = await db.incident.findUnique({
    where: { id: incidentId },
    select: {
      id: true,
      reporterId: true,
      reporter: { select: { role: true } },
      site: { select: { landownerId: true } },
      booking: { select: { operatorId: true } },
      messages: { where: { visibility: 'target' }, select: { id: true } },
    },
  })
  if (!incident) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Incident not found',
      code: 'NOT_FOUND',
    })
  }

  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'
  const isReporter = incident.reporterId === cognitoUser.sub
  const reporterRole = incident.reporter?.role
  let targetId: string | null = null
  if (reporterRole === 'OPERATOR') {
    targetId = incident.site?.landownerId ?? null
  } else if (reporterRole === 'LANDOWNER') {
    targetId = incident.booking?.operatorId ?? null
  }
  const isTarget = targetId === cognitoUser.sub
  const isTargetInvolved = isTarget && incident.messages.length > 0

  if (!isAdmin) {
    if (!isReporter && !isTargetInvolved) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'You do not have permission to access this incident',
        code: 'FORBIDDEN',
      })
    }
  }

  const requestedVisibility = body.visibility || null
  let visibility = requestedVisibility

  if (isAdmin) {
    visibility = requestedVisibility || 'reporter'
  } else if (isReporter) {
    visibility = 'reporter'
    if (requestedVisibility && requestedVisibility !== visibility) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'Reporters can only send reporter-visible messages',
        code: 'FORBIDDEN',
      })
    }
  } else {
    visibility = 'target'
    if (requestedVisibility && requestedVisibility !== visibility) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'Reported users can only send target-visible messages',
        code: 'FORBIDDEN',
      })
    }
  }

  if (visibility === 'internal' && !isAdmin) {
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
      data: body.attachments.map((attachment: any) => ({
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

  const updatedIncident = await db.incident.findUnique({
    where: { id: incidentId },
    include: incidentInclude,
  })
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

  return serializeIncident(updatedIncident)
}
