// services/billing-service/src/billing.service.ts
import Stripe from "stripe";
import { config, AppLogger, ExternalServiceError } from "@vertiaccess/core";

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2024-04-10", // use latest stable
  typescript: true,
});

export const logger = new AppLogger("BillingService");

export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  planTier: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    // Determine Price ID based on planTier 
    // In production, you would map these accurately or store them in DB/Env vars
    let priceId = "";
    if (params.planTier === "Professional") priceId = process.env.STRIPE_PRICE_PRO || "price_dummy";
    else if (params.planTier === "Growth") priceId = process.env.STRIPE_PRICE_GROWTH || "price_dummy";
    else if (params.planTier === "Enterprise") priceId = process.env.STRIPE_PRICE_ENTERPRISE || "price_dummy";
    else throw new Error("Invalid plan tier");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: params.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.userId,
      metadata: {
        userId: params.userId,
        planTier: params.planTier,
      },
    });

    return session.url;
  } catch (error: any) {
    logger.error("Failed to create Stripe checkout session", { error });
    throw new ExternalServiceError("Stripe checkout session creation failed");
  }
}
