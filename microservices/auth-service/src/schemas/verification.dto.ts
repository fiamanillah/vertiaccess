import { z } from 'zod';

export const updateVerificationSchema = {
    body: z.object({
        status: z.enum(['APPROVED', 'REJECTED']),
        adminNote: z.string().optional(),
    }),
};

export const submitIdentitySchema = {
    body: z.object({
        documentType: z.enum(['national_id', 'passport']),
        fileKey: z.string().min(1),
    }),
};

// Operators submit their registered credentials for review — no extra fields needed.
// The flyerId / operatorReference are pulled from the existing OperatorProfile.
export const submitOperatorVerificationSchema = {
    body: z
        .object({
            supportingDocuments: z
                .array(
                    z.object({
                        fileKey: z.string().min(1),
                        fileName: z.string().min(1).optional(),
                    })
                )
                .optional(),
        })
        .optional(),
};
