import type { Context } from 'hono';
import { sendCreatedResponse } from '@vertiaccess/core';
import { authService } from '../services/auth.service.ts';
import type { CreateAdminDTO } from '../schemas/auth.dto.ts';
import { db } from '@vertiaccess/database';
import type { CognitoUser } from '@vertiaccess/core';

/**
 * Handler: POST /auth/v1/admin/register
 * Only an existing Admin can register a new Admin.
 */
export async function adminRegisterHandler(c: Context): Promise<Response> {
    // 1. Authorization: verify current user is an ADMIN
    const currentUser = c.get('cognitoUser') as CognitoUser | undefined;

    if (!currentUser || currentUser.role.toUpperCase() !== 'ADMIN') {
        return c.json(
            { success: false, error: 'Forbidden', message: 'Only an admin can perform this action' },
            403
        );
    }

    const { email, firstName, lastName, password } = c.get('validatedBody') as CreateAdminDTO;

    // 2. Create admin in Cognito (using standard signUp but with admin role)
    // You could also use AdminCreateUserCommand natively depending on the business need,
    // but the `authService.signUp` already supports standard flow.
    const result = await authService.signUp(email, password, firstName, lastName, 'admin');

    // 3. Create user in the database
    await db.$transaction(async tx => {
        await tx.user.upsert({
            where: { id: result.userSub },
            create: {
                id: result.userSub,
                email,
                role: 'ADMIN',
                // Since this might trigger email to confirm, we set to UNVERIFIED
                // if you use AdminCreateUser it auto verifies, but we use signUp here.
                status: 'UNVERIFIED',
            },
            update: {},
        });

        // Note: Admin profile is not strongly typed with special fields yet
    });

    return sendCreatedResponse(
        c,
        {
            userSub: result.userSub,
            userConfirmed: result.userConfirmed,
            message: 'Admin registered successfully. Please check your email for a verification code.',
        },
        'Admin user registered successfully'
    );
}
