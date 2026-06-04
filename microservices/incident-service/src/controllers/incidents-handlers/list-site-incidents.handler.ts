import type { Context } from 'hono'
import { sendResponse, AppError, HTTPStatusCode } from '@vertiaccess/core'
import { IncidentsService } from '../../services/incidents/incidents.service'

export async function listSiteIncidentsHandler(c: Context): Promise<Response> {
  const cognitoUser = c.get('cognitoUser') as any
  const siteId = c.req.param('siteId')
  const { db } = await import('@vertiaccess/database')
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
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'
  if (!isAdmin && site.landownerId !== cognitoUser.sub) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'You do not have permission to access this site',
      code: 'FORBIDDEN',
    })
  }
  const { serializeIncident } = await import('../../services/incidents/helpers')
  const incidents = await db.incident.findMany({
    where: { siteId },
    include: (await import('../../services/incidents/helpers')).incidentInclude,
    orderBy: { createdAt: 'desc' },
  })
  const data = incidents.map((i) =>
    serializeIncident(i, isAdmin ? 'admin' : 'landowner', cognitoUser.sub),
  )
  return sendResponse(c, {
    message: 'Site incidents retrieved successfully',
    data,
  })
}
