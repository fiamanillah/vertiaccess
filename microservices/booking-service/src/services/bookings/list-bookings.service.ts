import type { CognitoUser } from '@vertiaccess/core'
import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode } from '@vertiaccess/core'
import { bookingInclude } from './utils'

export async function listMyBookings(cognitoUser: CognitoUser) {
  return db.booking.findMany({
    where: { operatorId: cognitoUser.sub },
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  })
}

export async function listSiteBookings(cognitoUser: CognitoUser, siteId: string) {
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

  if (!isAdmin) {
    const site = await db.site.findUnique({ where: { id: siteId } })
    if (!site || site.deletedAt) {
      throw new AppError({
        statusCode: HTTPStatusCode.NOT_FOUND,
        message: 'Site not found',
        code: 'NOT_FOUND',
      })
    }
    if (site.landownerId !== cognitoUser.sub) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'Access denied',
        code: 'FORBIDDEN',
      })
    }
  }

  return db.booking.findMany({
    where: { siteId },
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  })
}

export async function listLandownerBookings(cognitoUser: CognitoUser) {
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

  const ownedSites = await db.site.findMany({
    where: isAdmin
      ? { deletedAt: null }
      : { landownerId: cognitoUser.sub, deletedAt: null },
    select: { id: true },
  })

  const siteIds = ownedSites.map((s) => s.id)

  return db.booking.findMany({
    where: { siteId: { in: siteIds } },
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  })
}
