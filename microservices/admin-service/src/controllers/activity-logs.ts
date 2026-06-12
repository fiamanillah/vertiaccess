import type { Context } from 'hono'
import {
  sendPaginatedResponse,
  type CognitoUser,
  AppError,
  HTTPStatusCode,
} from '@vertiaccess/core'
import { db } from '@vertiaccess/database'

/**
 * GET /admin/v1/activity-logs
 * Retrieves all activity logs on the platform with filtering and pagination.
 * Only accessible by ADMIN role.
 */
export async function listAllActivityLogsHandler(c: Context) {
  const currentUser = c.get('cognitoUser') as CognitoUser | undefined

  if (!currentUser || currentUser.role.toUpperCase() !== 'ADMIN') {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Only an admin can perform this action',
      code: 'FORBIDDEN',
    })
  }

  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = parseInt(c.req.query('limit') || '20', 10)
  const skip = (page - 1) * limit

  const actorId = c.req.query('actorId')
  const siteId = c.req.query('siteId')
  const entityType = c.req.query('entityType')
  const eventType = c.req.query('eventType')
  const actorType = c.req.query('actorType')
  const search = c.req.query('search')

  const where: any = {}

  if (actorId) where.actorId = actorId
  if (siteId) where.siteId = siteId
  if (entityType) where.entityType = entityType
  if (eventType) where.eventType = eventType
  if (actorType) where.actorType = actorType

  if (search) {
    where.OR = [
      { eventType: { contains: search, mode: 'insensitive' } },
      { actorId: { contains: search, mode: 'insensitive' } },
      { entityId: { contains: search, mode: 'insensitive' } },
    ]
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

  // Extract all user/actor IDs for batch enrichment
  const userIdsToLookup = new Set<string>()
  logs.forEach((log) => {
    if (log.actorId && log.actorId !== 'system') {
      userIdsToLookup.add(log.actorId)
    }
    if (log.entityType === 'user' && log.entityId) {
      userIdsToLookup.add(log.entityId)
    }
  })

  // Batch query user profiles
  const users = userIdsToLookup.size > 0
    ? await db.user.findMany({
        where: { id: { in: Array.from(userIdsToLookup) } },
        select: {
          id: true,
          email: true,
          role: true,
          operatorProfile: {
            select: { fullName: true, vaId: true, organisation: true },
          },
          assetManagerProfile: {
            select: { fullName: true, vaId: true, organisation: true },
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
      organisation: profile?.organisation || null,
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
    message: 'Activity logs retrieved successfully',
  })
}
