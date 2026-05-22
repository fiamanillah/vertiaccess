import type { Context } from 'hono'
import { sendResponse } from '@vertiaccess/core'
import { BookingsService } from '../services/bookings/bookings.service'
import { getCognitoUser } from './helpers'
import {
  serializePaymentMethod,
  serializeSubscription,
} from '../utils/serializers/booking.serializer'

export async function getBookingCheckoutContextHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const siteId = c.req.param('siteId')
  const useCategory =
    c.req.query('useCategory') === 'emergency_recovery'
      ? 'emergency_recovery'
      : 'planned_toal'

  const ctx = await BookingsService.getCheckoutContext(
    cognitoUser,
    siteId,
    useCategory,
  )

  return sendResponse(c, {
    message: 'Booking checkout context fetched',
    data: {
      siteId: ctx.siteId,
      siteName: ctx.siteName,
      siteAddress: ctx.siteAddress,
      useCategory: ctx.useCategory,
      subscription: ctx.subscription
        ? serializeSubscription(ctx.subscription)
        : null,
      pricing: ctx.pricing,
      paymentMethods: ctx.paymentMethods.map(serializePaymentMethod),
      defaultPaymentMethodId: ctx.defaultPaymentMethodId,
      selectedPaymentMethodId: ctx.selectedPaymentMethodId,
      requiresCard: ctx.requiresCard,
    },
  })
}
