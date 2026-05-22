import type { Context } from 'hono'
import { sendResponse } from '@vertiaccess/core'
import { BookingsService } from '../services/bookings/bookings.service'

export async function getPublicSiteAvailabilityHandler(
  c: Context,
): Promise<Response> {
  const siteId = c.req.param('siteId')
  const from = c.req.query('from')
  const to = c.req.query('to')

  const result = await BookingsService.getSiteAvailability(siteId, from, to)
  return sendResponse(c, {
    message: 'Site availability fetched',
    data: result,
  })
}
