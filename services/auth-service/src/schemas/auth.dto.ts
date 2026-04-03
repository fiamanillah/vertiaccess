// services/auth-service/src/auth.dto.ts
import { z } from "zod";

export const createUserSchema = {
  body: z.object({
    email: z.email("Invalid email address"),
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["landowner", "operator"]).default("operator"),
    organisation: z.string().optional(),
    flyerId: z.string().optional(),
    operatorId: z.string().optional(),
    contactPhone: z.string().optional(),
  }),
};

export type CreateUserDTO = z.infer<typeof createUserSchema.body>;

export const createAdminSchema = {
  body: z.object({
    email: z.email("Invalid email address"),
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.literal("admin").default("admin"),
  }),
};

export type CreateAdminDTO = z.infer<typeof createAdminSchema.body>;

export const loginSchema = {
  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
};

export type LoginDTO = z.infer<typeof loginSchema.body>;

export const confirmSchema = {
  body: z.object({
    email: z.email("Invalid email address"),
    code: z.string().length(6, "Confirmation code must be 6 digits"),
  }),
};

export type ConfirmDTO = z.infer<typeof confirmSchema.body>;

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
};

export type RefreshDTO = z.infer<typeof refreshSchema.body>;

export const forgotPasswordSchema = {
  body: z.object({
    email: z.email("Invalid email address"),
  }),
};

export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema.body>;

export const resetPasswordSchema = {
  body: z.object({
    email: z.email("Invalid email address"),
    code: z.string().length(6, "Confirmation code must be 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  }),
};

export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema.body>;

export const resendCodeSchema = {
  body: z.object({
    email: z.email("Invalid email address"),
  }),
};

export type ResendCodeDTO = z.infer<typeof resendCodeSchema.body>;
