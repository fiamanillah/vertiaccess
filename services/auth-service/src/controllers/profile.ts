import type { Context } from 'hono';
import { sendResponse, type CognitoUser } from '@vertiaccess/core';
import { db } from '@vertiaccess/database';
import { authService } from '../services/auth.service.ts';
import type { ChangePasswordDTO, UpdateMyProfileDTO } from '../schemas/auth.dto.ts';

/**
 * PATCH /auth/v1/users/me/profile
 * Update editable profile fields for the authenticated user.
 */
export async function updateMyProfileHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const body = c.get('validatedBody') as UpdateMyProfileDTO;

    const userRecord = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        select: {
            role: true,
            operatorProfile: {
                select: {
                    fullName: true,
                    organisation: true,
                    flyerId: true,
                    operatorReference: true,
                },
            },
            landownerProfile: {
                select: {
                    fullName: true,
                    organisation: true,
                },
            },
        },
    });

    if (!userRecord) {
        return c.json({ success: false, message: 'User not found' }, 404);
    }

    if (userRecord.role === 'OPERATOR') {
        const existing = userRecord.operatorProfile;
        if (!existing) {
            return c.json({ success: false, message: 'Operator profile not found' }, 404);
        }

        const updateData: {
            fullName?: string;
            organisation?: string | null;
            flyerId?: string;
            operatorReference?: string | null;
        } = {};

        if (body.fullName !== undefined) updateData.fullName = body.fullName;
        if (body.organisation !== undefined) updateData.organisation = body.organisation;
        if (body.flyerId !== undefined) updateData.flyerId = body.flyerId;
        if (body.operatorId !== undefined) updateData.operatorReference = body.operatorId;

        const updated = await db.operatorProfile.update({
            where: { userId: cognitoUser.sub },
            data: updateData,
            select: {
                fullName: true,
                organisation: true,
                flyerId: true,
                operatorReference: true,
            },
        });

        return sendResponse(c, {
            data: {
                fullName: updated.fullName,
                organisation: updated.organisation,
                flyerId: updated.flyerId,
                operatorId: updated.operatorReference,
            },
            message: 'Profile updated successfully',
        });
    }

    const existing = userRecord.landownerProfile;
    if (!existing) {
        return c.json({ success: false, message: 'Landowner profile not found' }, 404);
    }

    const updateData: {
        fullName?: string;
        organisation?: string | null;
    } = {};

    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.organisation !== undefined) updateData.organisation = body.organisation;

    const updated = await db.landownerProfile.update({
        where: { userId: cognitoUser.sub },
        data: updateData,
        select: {
            fullName: true,
            organisation: true,
        },
    });

    return sendResponse(c, {
        data: {
            fullName: updated.fullName,
            organisation: updated.organisation,
        },
        message: 'Profile updated successfully',
    });
}

/**
 * POST /auth/v1/users/me/change-password
 * Change password using current password verification.
 */
export async function changePasswordHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const { currentPassword, newPassword } = c.get('validatedBody') as ChangePasswordDTO;

    await authService.changePassword(cognitoUser.email, currentPassword, newPassword);

    const passwordChangeNotice = await db.notification.create({
        data: {
            userId: cognitoUser.sub,
            type: 'security',
            title: 'Password Changed',
            message: 'Your account password was changed successfully.',
            actionUrl: '/dashboard',
        },
    });

    return sendResponse(c, {
        data: {
            changed: true,
            passwordChangedAt: passwordChangeNotice.createdAt.toISOString(),
        },
        message: 'Password changed successfully',
    });
}
