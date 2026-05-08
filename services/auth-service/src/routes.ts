// services/auth-service/src/routes.ts
import { Hono } from 'hono';
import { validateRequest } from '@vertiaccess/core';
import {
    createUserSchema,
    loginSchema,
    confirmSchema,
    refreshSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resendCodeSchema,
} from './schemas/auth.dto.ts';
import { registerHandler } from './controllers/register.ts';
import { loginHandler } from './controllers/login.ts';
import { confirmHandler } from './controllers/confirm.ts';
import { refreshHandler } from './controllers/refresh.ts';
import { forgotPasswordHandler } from './controllers/forgot-password.ts';
import { resetPasswordHandler } from './controllers/reset-password.ts';
import { resendCodeHandler } from './controllers/resend-code.ts';

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

export { authRoutes };
