import { Hono } from 'hono'
import { cognitoAuth } from '@vertiaccess/core'
import {
  getPublicSiteAvailabilityHandler,
  listMyBookingsHandler,
  listSiteBookingsHandler,
  listAssetManagerBookingsHandler,
  getBookingHandler,
  getBookingTimelineHandler,
  getAssetManagerDashboardStatsHandler,
} from './controllers/bookings.ts'

export const bookingQueryRoutes = new Hono()


// Public availability
bookingQueryRoutes.get(
  '/availability/:siteId',
  getPublicSiteAvailabilityHandler,
)

// Operator queries
bookingQueryRoutes.get('/mine', cognitoAuth(), listMyBookingsHandler)

// AssetManager/Admin queries
bookingQueryRoutes.get(
  '/assetmanager/stats',
  cognitoAuth(),
  getAssetManagerDashboardStatsHandler,
)
bookingQueryRoutes.get(
  '/assetmanager',
  cognitoAuth(),
  listAssetManagerBookingsHandler,
)
bookingQueryRoutes.get('/site/:siteId', cognitoAuth(), listSiteBookingsHandler)

// Shared queries
bookingQueryRoutes.get('/:bookingId', cognitoAuth(), getBookingHandler)
bookingQueryRoutes.get(
  '/:bookingId/timeline',
  cognitoAuth(),
  getBookingTimelineHandler,
)
