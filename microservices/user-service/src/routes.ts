// services/user-service/src/routes.ts
import { Hono } from 'hono';
import { validateRequest, cognitoAuth } from '@vertiaccess/core';
import {
    updateMyProfileSchema,
    changePasswordSchema,
} from './schemas/auth.dto.ts';
import {
    submitIdentitySchema,
    submitOperatorVerificationSchema,
} from './schemas/verification.dto.ts';
import { meHandler } from './controllers/me.ts';
import { updateMyProfileHandler, changePasswordHandler, deactivateAccountHandler } from './controllers/profile.ts';
import {
    submitIdentityHandler,
    submitOperatorVerificationHandler,
} from './controllers/identity.ts';

/**
 * User service routes — mounted at /users/v1
 */
const userRoutes = new Hono();

// ── Protected routes (require valid Cognito token) ────────────────────────────
userRoutes.get('/me', cognitoAuth(), meHandler);
userRoutes.patch(
    '/me/profile',
    cognitoAuth(),
    validateRequest(updateMyProfileSchema),
    updateMyProfileHandler
);
userRoutes.post(
    '/me/change-password',
    cognitoAuth(),
    validateRequest(changePasswordSchema),
    changePasswordHandler
);
userRoutes.post('/me/deactivate', cognitoAuth(), deactivateAccountHandler);

import { submitAppealHandler } from './controllers/appeal.ts';
userRoutes.post('/appeal', cognitoAuth(), submitAppealHandler);

// Landowner identity verification (national ID / passport upload)
userRoutes.post(
    '/me/identity',
    cognitoAuth(),
    validateRequest(submitIdentitySchema),
    submitIdentityHandler
);

// Operator verification (submits registered flyerId / operatorReference for review)
userRoutes.post(
    '/me/operator-verification',
    cognitoAuth(),
    validateRequest(submitOperatorVerificationSchema),
    submitOperatorVerificationHandler
);

export { userRoutes as authRoutes }; // Export as authRoutes temporarily so index.ts doesn't break, we will fix index.ts later
