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

  // Check if there is any pending identity verification for this user
  const pendingIdentityVerification = await db.verification.findFirst({
    where: {
      userId: cognitoUser.sub,
      type: "identity",
      status: "PENDING",
    },
  });

  // Map DB status to frontend-friendly value
  const dbStatus = userRecord?.status ?? "UNVERIFIED";
  const verificationStatus = dbStatus; // UNVERIFIED | VERIFIED | SUSPENDED
  const isVerified = dbStatus === "VERIFIED";

  return sendResponse(c, {
    data: {
      sub: cognitoUser.sub,
      email: cognitoUser.email,
      role: cognitoUser.role,
      firstName: cognitoUser.firstName,
      lastName: cognitoUser.lastName,
      verified: isVerified,
      verificationStatus,
      hasPendingVerification: !!pendingIdentityVerification,
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
