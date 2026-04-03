// services/auth-service/src/login.ts
import type { Context } from "hono";
import { sendResponse } from "@serverless-backend-starter/core";
import { authService } from "../services/auth.service.ts";
import type { LoginDTO } from "../schemas/auth.dto.ts";

/**
 * Handler: POST /auth/v1/login
 * Authenticates a user via Cognito and returns tokens.
 */
export async function loginHandler(c: Context): Promise<Response> {
  const { email, password } = c.get("validatedBody") as LoginDTO;

  const tokens = await authService.signIn(email, password);

  return sendResponse(c, {
    data: {
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    },
    message: "Login successful",
  });
}
