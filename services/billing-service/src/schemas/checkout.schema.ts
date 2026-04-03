import { z } from "zod";

export const checkoutSchema = {
  body: z.object({
    planTier: z.string(),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
  })
};
