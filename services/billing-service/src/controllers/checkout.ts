// services/billing-service/src/checkout.ts
import type { Context } from "hono";
import { sendResponse, type CognitoUser } from "@serverless-backend-starter/core";
import { createCheckoutSession } from "../services/billing.service.ts";
import type { checkoutSchema } from "../schemas/checkout.schema.ts";
import { z } from "zod";

type CheckoutDTO = z.infer<typeof checkoutSchema.body>;

/**
 * Handler: POST /billing/v1/checkout
 * Creates a Stripe checkout session for the authenticated user
 */
export async function checkoutHandler(c: Context): Promise<Response> {
  const cognitoUser = c.get("cognitoUser") as CognitoUser;
  const body = c.get("validatedBody") as CheckoutDTO;

  const url = await createCheckoutSession({
    userId: cognitoUser.sub,
    email: cognitoUser.email,
    planTier: body.planTier,
    successUrl: body.successUrl,
    cancelUrl: body.cancelUrl,
  });

  return sendResponse(c, {
    data: { url },
    message: "Checkout session created",
  });
}
