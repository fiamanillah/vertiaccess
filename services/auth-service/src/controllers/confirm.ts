// services/auth-service/src/confirm.ts
import type { Context } from "hono";
import { sendResponse } from "@serverless-backend-starter/core";
import { authService } from "../services/auth.service.ts";
import type { ConfirmDTO } from "../schemas/auth.dto.ts";

/**
 * Handler: POST /auth/v1/confirm
 * Confirms user sign-up with a verification code sent via email.
 */
export async function confirmHandler(c: Context): Promise<Response> {
  const { email, code } = c.get("validatedBody") as ConfirmDTO;

  await authService.confirmSignUp(email, code);

  return sendResponse(c, {
    data: {
      confirmed: true,
      message: "Email verified successfully. You can now log in.",
    },
    message: "Email confirmed",
  });
}
