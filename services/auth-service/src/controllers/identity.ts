import type { Context } from "hono";
import { sendResponse, sendCreatedResponse, type CognitoUser } from "@serverless-backend-starter/core";
import { db } from "@serverless-backend-starter/database";

export async function submitIdentityHandler(c: Context) {
  const cognitoUser = c.get("cognitoUser") as CognitoUser;
  const body = await c.req.json();
  const { documentType, fileKey } = body;

  const verification = await db.verification.create({
    data: {
      type: "identity",
      status: "PENDING",
      userId: cognitoUser.sub,
      submittedDocuments: [
        {
          documentType,
          fileKey,
          uploadedAt: new Date().toISOString(),
        }
      ]
    }
  });

  return sendCreatedResponse(c, {
    data: verification,
    message: "Identity document submitted for verification",
  });
}
