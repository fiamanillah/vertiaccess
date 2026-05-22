import type { Context } from 'hono'
import { z } from 'zod'
import { sendResponse, sendCreatedResponse } from '@vertiaccess/core'
import { BookingsService } from '../services/bookings/bookings.service'
import { getCognitoUser } from './helpers'
import { serializeBooking } from '../utils/serializers/booking.serializer'
import { createBookingSchema } from '../schemas/booking.schema'

export async function createBookingHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const body = (c.req as any).valid('json') as z.infer<
    typeof createBookingSchema
  >

  const booking = await BookingsService.createBooking(cognitoUser, body)
  return sendCreatedResponse(
    c,
    serializeBooking(booking),
    'Booking request submitted',
  )
}

export async function listMyBookingsHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)

  const bookings = await BookingsService.listMyBookings(cognitoUser)
  return sendResponse(c, {
    message: 'Bookings fetched',
    data: bookings.map(serializeBooking),
  })
}

export async function listSiteBookingsHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const siteId = c.req.param('siteId')

  const bookings = await BookingsService.listSiteBookings(cognitoUser, siteId)
  return sendResponse(c, {
    message: 'Site bookings fetched',
    data: bookings.map(serializeBooking),
  })
}

export async function listLandownerBookingsHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)

  const bookings = await BookingsService.listLandownerBookings(cognitoUser)
  return sendResponse(c, {
    message: 'Landowner bookings fetched',
    data: bookings.map(serializeBooking),
  })
}

export async function getBookingHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const bookingId = c.req.param('bookingId')

  const booking = await BookingsService.getBooking(cognitoUser, bookingId)
  return sendResponse(c, {
    message: 'Booking fetched',
    data: serializeBooking(booking),
  })
}
