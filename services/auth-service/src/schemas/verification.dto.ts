import { z } from "zod";

export const updateVerificationSchema = {
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
  }),
};

export const submitIdentitySchema = {
  body: z.object({
    documentType: z.enum(["national_id", "passport"]),
    fileKey: z.string().min(1),
  }),
};
