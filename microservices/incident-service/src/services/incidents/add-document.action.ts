import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode, type CognitoUser } from '@vertiaccess/core'
import { ensureAuthenticatedUserExists } from './ensure-user.action'
import {
  buildDocumentFileKey,
  incidentInclude,
  serializeIncident,
} from './helpers'
import { createIncidentNotifications } from './notifications.service'

export async function addIncidentDocumentAction(
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
      site: { select: { assetOwnerId: true } },
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
  if (!isAdmin) {
    const isReporter = incident.reporterId === cognitoUser.sub

    const reporterRole = incident.reporter?.role
    let targetId: string | null = null
    if (reporterRole === 'OPERATOR') {
      targetId = incident.site?.assetOwnerId ?? null
    } else if (reporterRole === 'ASSETOWNER') {
      targetId = incident.booking?.operatorId ?? null
    }
    const isTarget = targetId === cognitoUser.sub
    const isTargetInvolved = isTarget && incident.messages.length > 0

    if (!isReporter && !isTargetInvolved) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'You do not have permission to access this incident',
        code: 'FORBIDDEN',
      })
    }
  }

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
    'Incident Document Added',
    `A document has been attached to incident ${updatedIncident.id}.`,
  )

  const viewerRole = isAdmin
    ? 'admin'
    : (cognitoUser.role || '').toLowerCase() === 'assetowner'
      ? 'assetowner'
      : 'operator'
  return serializeIncident(updatedIncident, viewerRole, effectiveUserId)
}
