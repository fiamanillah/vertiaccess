// services/auth-service/src/forgot-password.ts
import type { Context } from "hono";
import { sendResponse } from "@vertiaccess/core";
import { authService } from "../services/auth.service.ts";
import type { ForgotPasswordDTO } from "../schemas/auth.dto.ts";

/**
 * Handler: POST /auth/v1/forgot-password
 * Initiates the forgot password flow — sends a reset code via email.
 */
export async function forgotPasswordHandler(c: Context): Promise<Response> {
  const { email } = c.get("validatedBody") as ForgotPasswordDTO;

  await authService.forgotPassword(email);

  return sendResponse(c, {
    data: {
      message: "If an account with that email exists, a password reset code has been sent.",
    },
    message: "Forgot password initiated",
  });
}
