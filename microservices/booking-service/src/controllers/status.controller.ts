import type { Context } from 'hono'
import { z } from 'zod'
import { sendResponse } from '@vertiaccess/core'
import { BookingsService } from '../services/bookings/bookings.service'
import { getCognitoUser } from './helpers'
import { serializeBooking } from '../utils/serializers/booking.serializer'
import { updateBookingStatusSchema } from '../schemas/booking.schema'

export async function updateBookingStatusHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const bookingId = c.req.param('bookingId')
  const body = (c.req as any).valid('json') as z.infer<
    typeof updateBookingStatusSchema
  >

  const updatedBooking = await BookingsService.updateBookingStatus(
    cognitoUser,
    bookingId,
    body,
  )

  return sendResponse(c, {
    message: `Booking ${body.status.toLowerCase()} successfully`,
    data: serializeBooking(updatedBooking),
  })
}
