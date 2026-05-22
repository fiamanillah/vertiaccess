import type { Context } from 'hono'
import { z } from 'zod'
import { sendResponse } from '@vertiaccess/core'
import { BookingsService } from '../services/bookings/bookings.service'
import { getCognitoUser } from './helpers'
import { serializeBooking } from '../utils/serializers/booking.serializer'
import { confirmEmergencyUsageSchema } from '../schemas/booking.schema'

export async function confirmEmergencyUsageHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const bookingId = c.req.param('bookingId')
  const body = (c.req as any).valid('json') as z.infer<
    typeof confirmEmergencyUsageSchema
  >

  const updated = await BookingsService.confirmEmergencyUsage(
    cognitoUser,
    bookingId,
    body,
  )

  return sendResponse(c, {
    message: body.used
      ? 'Emergency usage confirmed. Payment is being processed.'
      : 'Emergency usage marked as not used. No charge applied.',
    data: serializeBooking(updated),
  })
}
