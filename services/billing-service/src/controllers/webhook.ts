// services/billing-service/src/webhook.ts
import type { Context } from "hono";
import { stripe, logger } from "../services/billing.service.ts";
import { config, sendResponse, AppError, HTTPStatusCode } from "@serverless-backend-starter/core";
import { db } from "@serverless-backend-starter/database";

export async function webhookHandler(c: Context): Promise<Response> {
  const sig = c.req.header("stripe-signature");
  if (!sig) {
    throw new AppError({ statusCode: HTTPStatusCode.BAD_REQUEST, message: "Missing stripe-signature", code: "BAD_REQUEST" });
  }

  const rawBody = await c.req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err: any) {
    logger.error("Webhook signature verification failed", { error: err.message });
    throw new AppError({ statusCode: HTTPStatusCode.BAD_REQUEST, message: `Webhook Error: ${err.message}`, code: "BAD_REQUEST" });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.client_reference_id;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        if (userId && customerId && subscriptionId) {
          // Retrieve subscription to get dates and plan
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
          
          await db.$transaction(async (tx: any) => {
            const planTier = session.metadata?.planTier || "Standard";
            
            // Ensure SubscriptionPlan exists to satisfy foreign key
            let plan = await tx.subscriptionPlan.findFirst({
              where: { name: planTier },
            });
            if (!plan) {
              plan = await tx.subscriptionPlan.create({
                data: {
                  name: planTier,
                  monthlyPrice: 0,
                  annualPrice: 0,
                  currency: "GBP",
                },
              });
            }

            // Upsert UserSubscription
            await tx.userSubscription.upsert({
              where: { userId },
              create: {
                userId,
                planId: plan.id,
                stripeSubscriptionId: subscriptionId,
                status: "ACTIVE",
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              },
              update: {
                planId: plan.id,
                stripeSubscriptionId: subscriptionId,
                status: "ACTIVE",
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              },
            });
            
            // Update operator profile with customer ID if applicable
            const operator = await tx.operatorProfile.findUnique({ where: { userId } });
            if (operator) {
              await tx.operatorProfile.update({
                where: { userId },
                data: { stripeCustomerId: customerId },
              });
            }
          });
          logger.info(`Subscription created for user ${userId}`);
        }
        break;
      }
      
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        
        await db.userSubscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status.toUpperCase() === "ACTIVE" ? "ACTIVE" : "EXPIRED",
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        logger.info(`Subscription ${subscription.id} updated/deleted`);
        break;
      }

      default:
        logger.info(`Unhandled event type ${event.type}`);
    }

    return sendResponse(c, { message: "Webhook processed" });
  } catch (error) {
    logger.error("Error processing webhook", { error });
    throw new AppError({ statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR, message: "Internal Server Error", code: "INTERNAL_ERROR" });
  }
}
