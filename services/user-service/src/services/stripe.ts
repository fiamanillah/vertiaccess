import Stripe from "stripe";
import { config } from "@vertiaccess/core";

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2024-04-10",
  typescript: true,
});
