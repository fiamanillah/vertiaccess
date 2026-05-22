import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode } from '@vertiaccess/core'

export async function getSiteAvailability(
  siteId: string,
  from?: string,
  to?: string,
) {
  const site = await db.site.findUnique({
    where: { id: siteId },
    select: { id: true, name: true, deletedAt: true, status: true, exclusiveUse: true },
  })

  if (!site || site.deletedAt) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found',
      code: 'NOT_FOUND',
    })
  }

  const now = new Date()
  const startDate = from
    ? new Date(from)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endDate = to
    ? new Date(to)
    : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000)

  const bookings = await db.booking.findMany({
    where: {
      siteId,
      status: { in: ['PENDING', 'APPROVED'] },
      startTime: { lt: endDate },
      endTime: { gt: startDate },
    },
    select: { startTime: true, endTime: true, status: true, useCategory: true },
    orderBy: { startTime: 'asc' },
  })

  return {
    siteId,
    siteName: site.name,
    exclusiveUse: site.exclusiveUse,
    slots: bookings.map((b) => ({
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      status: b.status,
      useCategory: b.useCategory,
    })),
  }
}
