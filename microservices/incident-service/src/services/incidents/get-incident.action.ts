import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode, type CognitoUser } from '@vertiaccess/core'
import { ensureAuthenticatedUserExists } from './ensure-user.action'
import { incidentInclude, serializeIncident } from './helpers'

export async function getIncidentAction(
  cognitoUser: CognitoUser,
  incidentId: string,
) {
  await ensureAuthenticatedUserExists(cognitoUser)
  const incident = await db.incident.findUnique({
    where: { id: incidentId },
    include: incidentInclude,
  })
  if (!incident) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Incident not found',
      code: 'NOT_FOUND',
    })
  }

  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'
  const viewerRole = isAdmin
    ? 'admin'
    : (cognitoUser.role || '').toLowerCase() === 'landowner'
      ? 'landowner'
      : 'operator'
  if (!isAdmin) {
    const isReporter = incident.reporterId === cognitoUser.sub

    // Determine if the user is the target and has been involved by admin
    const reporterRole = incident.reporter?.role // 'OPERATOR' or 'LANDOWNER'
    let targetId: string | null = null
    if (reporterRole === 'OPERATOR') {
      targetId = incident.site?.landownerId ?? null
    } else if (reporterRole === 'LANDOWNER') {
      targetId = incident.booking?.operatorId ?? null
    }
    const isTarget = targetId === cognitoUser.sub
    const isTargetInvolved =
      isTarget && incident.messages.some((m) => m.visibility === 'target')

    if (!isReporter && !isTargetInvolved) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'You do not have permission to access this incident',
        code: 'FORBIDDEN',
      })
    }
  }

  return serializeIncident(incident, viewerRole, cognitoUser.sub)
}
