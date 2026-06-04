import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode, type CognitoUser } from '@vertiaccess/core'
import { incidentInclude, serializeIncident } from './helpers'
import { createIncidentNotifications } from './notifications.service'

export async function createIncidentDecisionAction(
  cognitoUser: CognitoUser,
  incidentId: string,
  body: any,
) {
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'
  if (!isAdmin) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Only administrators can record incident decisions',
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
    'Incident decision recorded',
    `Decision recorded for incident ${updatedIncident.id}`,
  )

  return serializeIncident(updatedIncident, 'admin', cognitoUser.sub)
}
