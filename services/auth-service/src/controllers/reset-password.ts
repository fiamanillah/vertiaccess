// services/auth-service/src/reset-password.ts
import type { Context } from "hono";
import { sendResponse } from "@serverless-backend-starter/core";
import { authService } from "../services/auth.service.ts";
import type { ResetPasswordDTO } from "../schemas/auth.dto.ts";

/**
 * Handler: POST /auth/v1/reset-password
 * Resets a user's password using the code sent via forgot-password.
 */
export async function resetPasswordHandler(c: Context): Promise<Response> {
  const { email, code, newPassword } = c.get("validatedBody") as ResetPasswordDTO;

  await authService.resetPassword(email, code, newPassword);

  return sendResponse(c, {
    data: {
      message: "Password has been reset successfully. You can now log in with your new password.",
    },
    message: "Password reset successful",
  });
}
