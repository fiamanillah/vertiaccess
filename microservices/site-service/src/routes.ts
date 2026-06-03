// services/site-service/src/routes.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { cognitoAuth } from '@vertiaccess/core'
import {
  createSiteSchema,
  updateSiteSchema,
  updateSiteStatusSchema,
} from './schemas/site.schema.ts'
import {
  createSiteHandler,
  listSitesHandler,
  getSiteHandler,
  getSiteStatsHandler,
  updateSiteHandler,
  updateSiteStatusHandler,
  deleteSiteHandler,
  listPublicSitesHandler,
  getPublicSiteHandler,
} from './controllers/sites.ts'

export const siteRoutes = new Hono()

// ==========================================
// Public endpoints (no auth)
// ==========================================
siteRoutes.get('/public', listPublicSitesHandler)
siteRoutes.get('/public/:siteId', getPublicSiteHandler)

// ==========================================
// Protected Site endpoints (require auth)
// ==========================================

// Site CRUD
siteRoutes.post(
  '/',
  cognitoAuth(),
  zValidator('json', createSiteSchema),
  createSiteHandler,
)
siteRoutes.get('/', cognitoAuth(), listSitesHandler)
siteRoutes.get('/:siteId', cognitoAuth(), getSiteHandler)
siteRoutes.get('/:siteId/stats', cognitoAuth(), getSiteStatsHandler)
siteRoutes.patch(
  '/:siteId',
  cognitoAuth(),
  zValidator('json', updateSiteSchema),
  updateSiteHandler,
)
siteRoutes.patch(
  '/:siteId/status',
  cognitoAuth(),
  zValidator('json', updateSiteStatusSchema),
  updateSiteStatusHandler,
)
siteRoutes.delete('/:siteId', cognitoAuth(), deleteSiteHandler)
