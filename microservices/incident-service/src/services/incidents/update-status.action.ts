import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode, type CognitoUser } from '@vertiaccess/core'
import { incidentInclude, serializeIncident } from './helpers'
import { createIncidentNotifications } from './notifications.service'

export async function updateIncidentStatusAction(
  cognitoUser: CognitoUser,
  incidentId: string,
  body: any,
) {
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'
  if (!isAdmin) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Only administrators can update incident status',
      code: 'FORBIDDEN',
    })
  }

  const incident = await db.incident.findUnique({
    where: { id: incidentId },
  })
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
      urgency: body.urgency ?? incident.urgency,
      adminNotes: body.adminNotes ?? incident.adminNotes,
      resolvedAt,
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
    cognitoUser.sub,
    `Incident ${body.status.toLowerCase()}`,
    `Incident ${updatedIncident.id} is now marked as ${body.status.replace(/_/g, ' ').toLowerCase()}.`,
  )

  return serializeIncident(updatedIncident, 'admin', cognitoUser.sub)
}
