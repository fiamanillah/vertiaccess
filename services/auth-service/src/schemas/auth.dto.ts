// services/auth-service/src/auth.dto.ts
import { z } from 'zod';

export const createUserSchema = {
    body: z.object({
        email: z.email('Invalid email address'),
        firstName: z.string().min(2, 'First name is too short'),
        lastName: z.string().min(2, 'Last name is too short'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        role: z.enum(['landowner', 'operator']).default('operator'),
        organisation: z.string().optional(),
        flyerId: z.string().optional(),
        operatorId: z.string().optional(),
        contactPhone: z.string().optional(),
    }),
};

export type CreateUserDTO = z.infer<typeof createUserSchema.body>;

export const createAdminSchema = {
    body: z.object({
        email: z.email('Invalid email address'),
        firstName: z.string().min(2, 'First name is too short'),
        lastName: z.string().min(2, 'Last name is too short'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        role: z.literal('admin').default('admin'),
    }),
};

export type CreateAdminDTO = z.infer<typeof createAdminSchema.body>;

export const loginSchema = {
    body: z.object({
        email: z.email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
};

export type LoginDTO = z.infer<typeof loginSchema.body>;

export const confirmSchema = {
    body: z.object({
        email: z.email('Invalid email address'),
        code: z.string().length(6, 'Confirmation code must be 6 digits'),
    }),
};

export type ConfirmDTO = z.infer<typeof confirmSchema.body>;

export const refreshSchema = {
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
};

export type RefreshDTO = z.infer<typeof refreshSchema.body>;

export const forgotPasswordSchema = {
    body: z.object({
        email: z.email('Invalid email address'),
    }),
};

export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema.body>;

export const resetPasswordSchema = {
    body: z.object({
        email: z.email('Invalid email address'),
        code: z.string().length(6, 'Confirmation code must be 6 digits'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    }),
};

export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema.body>;

export const resendCodeSchema = {
    body: z.object({
        email: z.email('Invalid email address'),
    }),
};

export type ResendCodeDTO = z.infer<typeof resendCodeSchema.body>;

export const updateMyProfileSchema = {
    body: z
        .object({
            fullName: z.string().trim().min(2, 'Full name is too short').optional(),
            organisation: z.string().trim().max(200).nullable().optional(),
            flyerId: z.string().trim().min(1, 'Flyer ID is required').optional(),
            operatorId: z.string().trim().min(1, 'Operator ID is required').nullable().optional(),
        })
        .refine(
            body =>
                body.fullName !== undefined ||
                body.organisation !== undefined ||
                body.flyerId !== undefined ||
                body.operatorId !== undefined,
            {
                message: 'At least one profile field must be provided',
            }
        ),
};

export type UpdateMyProfileDTO = z.infer<typeof updateMyProfileSchema.body>;

export const changePasswordSchema = {
    body: z
        .object({
            currentPassword: z.string().min(1, 'Current password is required'),
            newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        })
        .refine(body => body.currentPassword !== body.newPassword, {
            message: 'New password must be different from the current password',
            path: ['newPassword'],
        }),
};

export type ChangePasswordDTO = z.infer<typeof changePasswordSchema.body>;
