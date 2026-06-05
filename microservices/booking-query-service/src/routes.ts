import { Hono } from 'hono'
import { cognitoAuth } from '@vertiaccess/core'
import {
  getPublicSiteAvailabilityHandler,
  listMyBookingsHandler,
  listSiteBookingsHandler,
  listAssetOwnerBookingsHandler,
  getBookingHandler,
  getBookingTimelineHandler,
  getAssetOwnerDashboardStatsHandler,
} from './controllers/bookings.ts'

export const bookingQueryRoutes = new Hono()


// Public availability
bookingQueryRoutes.get(
  '/availability/:siteId',
  getPublicSiteAvailabilityHandler,
)

// Operator queries
bookingQueryRoutes.get('/mine', cognitoAuth(), listMyBookingsHandler)

// AssetOwner/Admin queries
bookingQueryRoutes.get(
  '/assetowner/stats',
  cognitoAuth(),
  getAssetOwnerDashboardStatsHandler,
)
bookingQueryRoutes.get(
  '/assetowner',
  cognitoAuth(),
  listAssetOwnerBookingsHandler,
)
bookingQueryRoutes.get('/site/:siteId', cognitoAuth(), listSiteBookingsHandler)

// Shared queries
bookingQueryRoutes.get('/:bookingId', cognitoAuth(), getBookingHandler)
bookingQueryRoutes.get(
  '/:bookingId/timeline',
  cognitoAuth(),
  getBookingTimelineHandler,
)
