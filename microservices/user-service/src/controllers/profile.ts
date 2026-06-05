import type { Context } from 'hono';
import { sendResponse, type CognitoUser, AppError, HTTPStatusCode, config } from '@vertiaccess/core';
import { db } from '@vertiaccess/database';
import { authService } from '../services/auth.service.ts';
import Stripe from 'stripe';
import type { ChangePasswordDTO, UpdateMyProfileDTO } from '../schemas/auth.dto.ts';

const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
});

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
            assetOwnerProfile: {
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

    const existing = userRecord.assetOwnerProfile;
    if (!existing) {
        return c.json({ success: false, message: 'AssetOwner profile not found' }, 404);
    }

    const updateData: {
        fullName?: string;
        organisation?: string | null;
    } = {};

    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.organisation !== undefined) updateData.organisation = body.organisation;

    const updated = await db.assetOwnerProfile.update({
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

/**
 * POST /auth/v1/users/me/deactivate
 * Deactivate user account. Handles active subscriptions and schedules deletion.
 */
export async function deactivateAccountHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;

    const user = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        include: { subscription: true },
    });

    if (!user) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'User not found',
            code: 'USER_NOT_FOUND',
        });
    }

    let deletionDate = new Date(); // default to instant deletion
    let accessUntilDateStr = deletionDate.toISOString();

    // If they have an active subscription, schedule deletion at the end of the period
    if (user.subscription?.stripeSubscriptionId && user.subscription.status === 'active') {
        try {
            const updatedStripeSub = await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
                cancel_at_period_end: true,
            });

            if (updatedStripeSub.current_period_end) {
                deletionDate = new Date(updatedStripeSub.current_period_end * 1000);
                accessUntilDateStr = deletionDate.toISOString();
            }

            await db.userSubscription.update({
                where: { id: user.subscription.id },
                data: { cancelAtPeriodEnd: true },
            });
        } catch (error) {
            console.error('Failed to update Stripe subscription during deactivation:', error);
            throw new AppError({
                statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
                message: 'Failed to process subscription cancellation',
                code: 'STRIPE_ERROR',
            });
        }
    } else {
        // If no active subscription, disable immediately in Cognito
        try {
            await authService.adminDisableUser(user.email);
            await authService.adminUserGlobalSignOut(user.email);
        } catch (error) {
            console.error('Failed to disable Cognito user during deactivation:', error);
            // Non-fatal
        }
    }

    // Update DB with soft delete date
    await db.user.update({
        where: { id: user.id },
        data: { deletedAt: deletionDate },
    });

    return sendResponse(c, {
        data: {
            deactivated: true,
            accessUntilDate: accessUntilDateStr,
        },
        message: 'Account successfully deactivated',
    });
}
