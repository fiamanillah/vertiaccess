// services/auth-service/src/routes.ts
import { Hono } from 'hono';
import { validateRequest, cognitoAuth } from '@vertiaccess/core';
import {
    createUserSchema,
    createAdminSchema,
    loginSchema,
    confirmSchema,
    refreshSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resendCodeSchema,
    updateMyProfileSchema,
    changePasswordSchema,
} from './schemas/auth.dto.ts';
import {
    updateVerificationSchema,
    submitIdentitySchema,
    submitOperatorVerificationSchema,
} from './schemas/verification.dto.ts';
import { registerHandler } from './controllers/register.ts';
import { adminRegisterHandler } from './controllers/admin-register.ts';
import { loginHandler } from './controllers/login.ts';
import { confirmHandler } from './controllers/confirm.ts';
import { refreshHandler } from './controllers/refresh.ts';
import { forgotPasswordHandler } from './controllers/forgot-password.ts';
import { resetPasswordHandler } from './controllers/reset-password.ts';
import { resendCodeHandler } from './controllers/resend-code.ts';
import { meHandler } from './controllers/me.ts';
import { updateMyProfileHandler, changePasswordHandler } from './controllers/profile.ts';
import {
    submitIdentityHandler,
    submitOperatorVerificationHandler,
} from './controllers/identity.ts';
import {
    listUsersHandler,
    listVerificationsHandler,
    updateVerificationHandler,
} from './controllers/admin.ts';
import { getAdminStatsHandler } from './controllers/stats.ts';

/**
 * Auth service routes — mounted at /auth/v1
 */
const authRoutes = new Hono();

// ── Public routes (no auth required) ─────────────────────────────────────────
authRoutes.post('/register', validateRequest(createUserSchema), registerHandler);
authRoutes.post('/login', validateRequest(loginSchema), loginHandler);
authRoutes.post('/confirm', validateRequest(confirmSchema), confirmHandler);
authRoutes.post('/refresh', validateRequest(refreshSchema), refreshHandler);
authRoutes.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPasswordHandler);
authRoutes.post('/reset-password', validateRequest(resetPasswordSchema), resetPasswordHandler);
authRoutes.post('/resend-code', validateRequest(resendCodeSchema), resendCodeHandler);

// ── Protected routes (require valid Cognito token) ────────────────────────────
authRoutes.get('/me', cognitoAuth(), meHandler);
authRoutes.patch(
    '/users/me/profile',
    cognitoAuth(),
    validateRequest(updateMyProfileSchema),
    updateMyProfileHandler
);
authRoutes.post(
    '/users/me/change-password',
    cognitoAuth(),
    validateRequest(changePasswordSchema),
    changePasswordHandler
);

// Landowner identity verification (national ID / passport upload)
authRoutes.post(
    '/users/me/identity',
    cognitoAuth(),
    validateRequest(submitIdentitySchema),
    submitIdentityHandler
);

// Operator verification (submits registered flyerId / operatorReference for review)
authRoutes.post(
    '/users/me/operator-verification',
    cognitoAuth(),
    validateRequest(submitOperatorVerificationSchema),
    submitOperatorVerificationHandler
);

// ── Admin routes ──────────────────────────────────────────────────────────────
authRoutes.post(
    '/admin/register',
    cognitoAuth(),
    validateRequest(createAdminSchema),
    adminRegisterHandler
);
authRoutes.get('/admin/users', cognitoAuth(), listUsersHandler);
authRoutes.get('/admin/verifications', cognitoAuth(), listVerificationsHandler);
authRoutes.get('/admin/stats', cognitoAuth(), getAdminStatsHandler);
authRoutes.put(
    '/admin/verifications/:id',
    cognitoAuth(),
    validateRequest(updateVerificationSchema),
    updateVerificationHandler
);

export { authRoutes };
