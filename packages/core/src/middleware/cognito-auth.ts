// packages/core/src/middleware/cognito-auth.ts
import type { Context, Next } from "hono";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { config } from "../config.ts";
import { AuthenticationError } from "../errors.ts";
import { AppLogger } from "../logger.ts";

const logger = new AppLogger("CognitoAuth");

// Lazy-init verifier (reused across Lambda invocations)
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!verifier) {
    if (!config.cognito.userPoolId || !config.cognito.clientId) {
      throw new Error(
        "Cognito configuration missing: COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set",
      );
    }
    verifier = CognitoJwtVerifier.create({
      userPoolId: config.cognito.userPoolId,
      tokenUse: "id",
      clientId: config.cognito.clientId,
    });
  }
  return verifier;
}

export interface CognitoUser {
  sub: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Hono middleware that verifies the Cognito ID token from the Authorization header.
 * Sets `c.set("cognitoUser", { sub, email, role })` for downstream handlers.
 */
export function cognitoAuth() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid Authorization header");
    }

    const token = authHeader.slice(7);

    try {
      const payload = await getVerifier().verify(token);

      const cognitoUser: CognitoUser = {
        sub: payload.sub,
        email: (payload.email as string) || "",
        role: (payload["custom:role"] as string) || "operator",
        firstName: (payload["custom:firstName"] as string) || undefined,
        lastName: (payload["custom:lastName"] as string) || undefined,
      };

      c.set("cognitoUser", cognitoUser);
      await next();
    } catch (error) {
      logger.error("Token verification failed", { error });
      throw new AuthenticationError("Invalid or expired token");
    }
  };
}
