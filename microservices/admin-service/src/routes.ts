import { Hono } from 'hono';
import { validateRequest, cognitoAuth, config } from '@vertiaccess/core';
import { createAdminSchema } from './schemas/auth.dto.ts';
import { updateVerificationSchema } from './schemas/verification.dto.ts';
import { adminRegisterHandler } from './controllers/admin-register.ts';
import {
    listUsersHandler,
    listUserVerificationsHandler,
    listSiteVerificationsHandler,
    getVerificationHandler,
    updateVerificationHandler,
    suspendUserHandler,
    reinstateUserHandler,
    getUserHandler,
    updateUserRoleHandler,
    deleteUserHandler,
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
adminRoutes.get('/users/:id', cognitoAuth(), getUserHandler);
adminRoutes.put('/users/:id/role', cognitoAuth(), updateUserRoleHandler);
adminRoutes.delete('/users/:id', cognitoAuth(), deleteUserHandler);
adminRoutes.get('/verifications/users', cognitoAuth(), listUserVerificationsHandler);
adminRoutes.get('/verifications/sites', cognitoAuth(), listSiteVerificationsHandler);
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

// Admin: force-charge an emergency booking (dispute resolution)
// Proxies to the payment service's admin-dispute-charge endpoint
adminRoutes.post('/bookings/:bookingId/force-charge', cognitoAuth(), async c => {
    const paymentServiceUrl = process.env.PAYMENT_SERVICE_INTERNAL_URL;
    const chargeKey = process.env.BOOKING_CHARGE_KEY;

    if (!paymentServiceUrl || !chargeKey) {
        return c.json({ success: false, message: 'Payment service not configured' }, 500);
    }

    const bookingId = c.req.param('bookingId');
    const authHeader = c.req.header('Authorization') ?? '';

    const res = await fetch(
        `${paymentServiceUrl}/billing/v1/bookings/${bookingId}/admin-dispute-charge`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
                'x-booking-charge-key': chargeKey,
            },
        }
    );

    const data = await res.json();
    return c.json(data, res.status as any);
});

export { adminRoutes as authRoutes }; // Export as authRoutes temporarily so index.ts doesn't break
