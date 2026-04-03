// services/auth-service/src/me.ts
import type { Context } from "hono";
import { sendResponse, type CognitoUser } from "@serverless-backend-starter/core";

import { db } from "@serverless-backend-starter/database";

/**
 * Handler: GET /auth/v1/me
 * Returns the current authenticated user's information from the database and token.
 */
export async function meHandler(c: Context): Promise<Response> {
  const cognitoUser = c.get("cognitoUser") as CognitoUser;

  // Fetch full details from database to get subscription and profile status
  const userRecord = await db.user.findUnique({
    where: { id: cognitoUser.sub },
    include: {
      operatorProfile: true,
      landownerProfile: true,
      subscription: {
        include: { plan: true },
      },
    },
  });

  return sendResponse(c, {
    data: {
      sub: cognitoUser.sub,
      email: cognitoUser.email,
      role: cognitoUser.role,
      firstName: cognitoUser.firstName,
      lastName: cognitoUser.lastName,
      verified: true, // Assuming token means verified via Cognito pool settings
      planTier: userRecord?.subscription?.plan?.name,
      subscriptionStatus: userRecord?.subscription?.status,
      organisation: userRecord?.operatorProfile?.organisation || userRecord?.landownerProfile?.organisation,
      flyerId: userRecord?.operatorProfile?.flyerId,
      operatorId: userRecord?.operatorProfile?.operatorReference,
      contactPhone: userRecord?.operatorProfile?.contactPhone || userRecord?.landownerProfile?.contactPhone,
    },
    message: "User info retrieved",
  });
}
