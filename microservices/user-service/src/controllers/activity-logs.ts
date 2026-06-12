import type { Context } from 'hono'
import {
  sendPaginatedResponse,
  type CognitoUser,
  AppError,
  HTTPStatusCode,
} from '@vertiaccess/core'
import { db } from '@vertiaccess/database'

/**
 * GET /users/v1/me/activity-logs
 * Retrieves activity logs for the current authenticated user.
 * Returns logs where actorId = currentUserId OR (entityId = currentUserId AND entityType = 'user').
 */
export async function getMyActivityLogsHandler(c: Context) {
  const currentUser = c.get('cognitoUser') as CognitoUser | undefined

  if (!currentUser) {
    throw new AppError({
      statusCode: HTTPStatusCode.UNAUTHORIZED,
      message: 'Unauthorized access',
      code: 'UNAUTHORIZED',
    })
  }

  const userId = currentUser.sub
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = parseInt(c.req.query('limit') || '20', 10)
  const skip = (page - 1) * limit

  const where = {
    OR: [
      { actorId: userId },
      {
        entityId: userId,
        entityType: 'user' as any,
      },
    ],
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            vaId: true,
            siteReference: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ])

  // Batch query user profiles for other actors/targets in logs if any (mostly system or admins acting on user)
  const userIdsToLookup = new Set<string>()
  logs.forEach((log) => {
    if (log.actorId && log.actorId !== 'system') {
      userIdsToLookup.add(log.actorId)
    }
    if (log.entityType === 'user' && log.entityId) {
      userIdsToLookup.add(log.entityId)
    }
  })

  const users = userIdsToLookup.size > 0
    ? await db.user.findMany({
        where: { id: { in: Array.from(userIdsToLookup) } },
        select: {
          id: true,
          email: true,
          role: true,
          operatorProfile: {
            select: { fullName: true, vaId: true },
          },
          assetManagerProfile: {
            select: { fullName: true, vaId: true },
          },
        },
      })
    : []

  const userMap = new Map<string, any>()
  users.forEach((u) => {
    const profile = u.role === 'OPERATOR' ? u.operatorProfile : u.assetManagerProfile
    userMap.set(u.id, {
      id: u.id,
      email: u.email,
      role: u.role.toLowerCase(),
      fullName: profile?.fullName || 'Unknown User',
      vaId: profile?.vaId || null,
    })
  })

  const formattedLogs = logs.map((log) => {
    const actor = log.actorId === 'system'
      ? { id: 'system', fullName: 'System', role: 'system', vaId: null }
      : userMap.get(log.actorId) || { id: log.actorId, fullName: 'Unknown Actor', role: log.actorType.toLowerCase(), vaId: null }

    let targetUser = null
    if (log.entityType === 'user') {
      targetUser = userMap.get(log.entityId) || { id: log.entityId, fullName: 'Unknown User', vaId: null }
    }

    return {
      id: log.id,
      eventId: log.eventId,
      siteId: log.siteId,
      siteName: log.site?.name || null,
      siteVaId: log.site?.vaId || log.site?.siteReference || null,
      entityType: log.entityType,
      entityId: log.entityId,
      eventType: log.eventType,
      actorType: log.actorType,
      actorId: log.actorId,
      actorDetails: actor,
      targetUserDetails: targetUser,
      previousState: log.previousState,
      newState: log.newState,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    }
  })

  const totalPages = Math.ceil(total / limit)

  return sendPaginatedResponse(c, {
    data: formattedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
    message: 'User activity logs retrieved successfully',
  })
}
