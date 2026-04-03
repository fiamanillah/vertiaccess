// services/auth-service/src/refresh.ts
import type { Context } from "hono";
import { sendResponse } from "@serverless-backend-starter/core";
import { authService } from "../services/auth.service.ts";
import type { RefreshDTO } from "../schemas/auth.dto.ts";

/**
 * Handler: POST /auth/v1/refresh
 * Refreshes ID and access tokens using a refresh token.
 */
export async function refreshHandler(c: Context): Promise<Response> {
  const { refreshToken } = c.get("validatedBody") as RefreshDTO;

  const tokens = await authService.refreshToken(refreshToken);

  return sendResponse(c, {
    data: {
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
    message: "Tokens refreshed",
  });
}
