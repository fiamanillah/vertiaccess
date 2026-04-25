// services/auth-service/src/register.ts
import type { Context } from 'hono';
import { sendCreatedResponse, generateVTID } from '@vertiaccess/core';
import { authService } from '../services/auth.service.ts';
import type { CreateUserDTO } from '../schemas/auth.dto.ts';
import { db } from '@vertiaccess/database';

// Map string role to Prisma UserRole enum values
const ROLE_MAP: Record<string, 'OPERATOR' | 'LANDOWNER'> = {
    operator: 'OPERATOR',
    landowner: 'LANDOWNER',
};

/**
 * Handler: POST /auth/v1/register
 * Registers a new user in Cognito and creates a User row in the database.
 */
export async function registerHandler(c: Context): Promise<Response> {
    const { email, firstName, lastName, password, role } = c.get('validatedBody') as CreateUserDTO;

    // 1. Create user in Cognito
    const result = await authService.signUp(email, password, firstName, lastName, role);

    // 2. Create user and profile in the database via transaction
    await db.$transaction(async tx => {
        // Upsert User
        await tx.user.upsert({
            where: { id: result.userSub },
            create: {
                id: result.userSub,
                email,
                role: ROLE_MAP[role] || 'OPERATOR',
            },
            update: {},
        });

        const body = c.get('validatedBody') as CreateUserDTO;
        const fullName = `${firstName} ${lastName}`.trim();

        // Upsert Profile based on role
        if (role === 'operator') {
            const operatorProfileCreate = {
                userId: result.userSub,
                vtId: generateVTID('vt-op'),
                fullName,
                contactPhone: body.contactPhone || '',
                flyerId: body.flyerId || '',
                ...(body.organisation !== undefined ? { organisation: body.organisation } : {}),
                ...(body.operatorId !== undefined ? { operatorReference: body.operatorId } : {}),
            };

            await tx.operatorProfile.upsert({
                where: { userId: result.userSub },
                create: operatorProfileCreate,
                update: {},
            });
        } else if (role === 'landowner') {
            const landownerProfileCreate = {
                userId: result.userSub,
                vtId: generateVTID('vt-lo'),
                fullName,
                contactPhone: body.contactPhone || '',
                ...(body.organisation !== undefined ? { organisation: body.organisation } : {}),
            };

            await tx.landownerProfile.upsert({
                where: { userId: result.userSub },
                create: landownerProfileCreate,
                update: {},
            });
        }

        await tx.notification.create({
            data: {
                userId: result.userSub,
                type: 'success',
                title: 'Welcome to VertiAccess',
                message:
                    'Your account was created successfully. Complete your profile and verification to unlock all features.',
                actionUrl: '/dashboard',
            },
        });
    });

    return sendCreatedResponse(
        c,
        {
            userSub: result.userSub,
            userConfirmed: result.userConfirmed,
            message: 'Registration successful. Please check your email for a verification code.',
        },
        'User registered successfully'
    );
}
