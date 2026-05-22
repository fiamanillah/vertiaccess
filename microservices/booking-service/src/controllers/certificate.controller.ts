import type { Context } from 'hono'
import { sendResponse } from '@vertiaccess/core'
import { BookingsService } from '../services/bookings/bookings.service'
import { getCognitoUser } from './helpers'

export async function getBookingCertificateHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const bookingId = c.req.param('bookingId')

  const certificateData = await BookingsService.getBookingCertificate(
    cognitoUser,
    bookingId,
  )
  return sendResponse(c, {
    message: 'Certificate fetched',
    data: certificateData,
  })
}
