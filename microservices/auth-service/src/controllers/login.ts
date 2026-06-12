// services/auth-service/src/login.ts
import type { Context } from 'hono';
import { sendResponse, AppError, HTTPStatusCode } from '@vertiaccess/core';
import { db } from '@vertiaccess/database';
import { authService } from '../services/auth/auth.service.ts';
import type { LoginDTO } from '../schemas/auth.dto.ts';

/**
 * Handler: POST /auth/v1/login
 * Authenticates a user via Cognito and returns tokens.
 */
export async function loginHandler(c: Context): Promise<Response> {
    const { email, password } = c.get('validatedBody') as LoginDTO;

    // Check if user is banned
    const user = await db.user.findUnique({
        where: { email },
    });

    if (user && user.status === 'BANNED') {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Your account has been permanently banned.',
            code: 'ACCOUNT_BANNED',
        });
    }

    const tokens = await authService.signIn(email, password);

    try {
        await db.user.update({
            where: { email },
            data: { lastLoginAt: new Date() },
        });
    } catch (error) {
        console.error('Failed to update user lastLoginAt:', error);
    }

    return sendResponse(c, {
        data: {
            idToken: tokens.idToken,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        },
        message: 'Login successful',
    });
}
