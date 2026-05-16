// services/admin-service/src/routes.ts
import { Hono } from 'hono';
import { validateRequest, cognitoAuth } from '@vertiaccess/core';
import { createAdminSchema } from './schemas/auth.dto.ts';
import { updateVerificationSchema } from './schemas/verification.dto.ts';
import { adminRegisterHandler } from './controllers/admin-register.ts';
import {
    listUsersHandler,
    listVerificationsHandler,
    getVerificationHandler,
    updateVerificationHandler,
    suspendUserHandler,
    reinstateUserHandler,
} from './controllers/admin.ts';
import { getAdminStatsHandler } from './controllers/stats.ts';
import { getAdminAnalyticsHandler } from './controllers/analytics.ts';

/**
 * Admin service routes — mounted at /admin/v1
 */
const adminRoutes = new Hono();

// ── Admin routes ──────────────────────────────────────────────────────────────
adminRoutes.post(
    '/register',
    cognitoAuth(),
    validateRequest(createAdminSchema),
    adminRegisterHandler
);
adminRoutes.get('/users', cognitoAuth(), listUsersHandler);
adminRoutes.get('/verifications', cognitoAuth(), listVerificationsHandler);
adminRoutes.get('/verifications/:id', cognitoAuth(), getVerificationHandler);
adminRoutes.get('/stats', cognitoAuth(), getAdminStatsHandler);
adminRoutes.get('/analytics', cognitoAuth(), getAdminAnalyticsHandler);
adminRoutes.put(
    '/verifications/:id',
    cognitoAuth(),
    validateRequest(updateVerificationSchema),
    updateVerificationHandler
);
adminRoutes.post('/users/:id/suspend', cognitoAuth(), suspendUserHandler);
adminRoutes.post('/users/:id/reinstate', cognitoAuth(), reinstateUserHandler);

export { adminRoutes as authRoutes }; // Export as authRoutes temporarily so index.ts doesn't break
