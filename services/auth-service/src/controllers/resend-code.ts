// services/auth-service/src/resend-code.ts
import type { Context } from "hono";
import { sendResponse } from "@vertiaccess/core";
import { authService } from "../services/auth.service.ts";
import type { ResendCodeDTO } from "../schemas/auth.dto.ts";

/**
 * Handler: POST /auth/v1/resend-code
 * Resends the confirmation code for email verification.
 */
export async function resendCodeHandler(c: Context): Promise<Response> {
  const { email } = c.get("validatedBody") as ResendCodeDTO;

  await authService.resendConfirmationCode(email);

  return sendResponse(c, {
    data: {
      message: "A new verification code has been sent to your email.",
    },
    message: "Verification code resent",
  });
}
