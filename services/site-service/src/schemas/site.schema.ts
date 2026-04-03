// services/site-service/src/schemas/site.schema.ts
import { z } from "zod";

// ==========================================
// Geometry schemas
// ==========================================
const pointSchema = z.object({
    lat: z.number(),
    lng: z.number(),
});

const geometrySchema = z.object({
    type: z.enum(["circle", "polygon"]),
    center: pointSchema.optional(),
    radius: z.number().optional(),
    points: z.array(pointSchema).optional(),
    heightAGL: z.number().optional(),
});

// ==========================================
// Create Site
// ==========================================
export const createSiteSchema = z.object({
    name: z.string().min(1, "Site name is required"),
    description: z.string().optional(),
    siteType: z.enum(["toal", "emergency"]).optional(),
    siteCategory: z.enum([
        "private_land",
        "helipad",
        "vertiport",
        "droneport",
        "temporary_landing_site",
    ]).optional(),
    address: z.string().min(1, "Address is required"),
    postcode: z.string().min(1, "Postcode is required"),
    contactEmail: z.string().email("Valid email required"),
    contactPhone: z.string().min(1, "Contact phone is required"),

    // Geometry
    geometry: geometrySchema,
    clzGeometry: geometrySchema.optional(),
    geometryMetadata: z.record(z.string(), z.unknown()).optional(),

    // Validity
    validityStart: z.string().min(1, "Validity start is required"),
    validityEnd: z.string().optional().nullable(),

    // Flags
    autoApprove: z.boolean().default(false),
    exclusiveUse: z.boolean().default(false),
    emergencyRecoveryEnabled: z.boolean().default(false),
    clzEnabled: z.boolean().default(false),

    // Pricing
    toalAccessFee: z.number().optional(),
    clzAccessFee: z.number().optional(),
    hourlyRate: z.number().optional(),
    cancellationFeePercentage: z.number().optional(),

    // Documents (file keys from S3 uploads)
    documents: z.array(z.object({
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.string().optional(),
        documentType: z.enum(["policy", "ownership", "photo"]).optional(),
    })).optional(),

    // Additional info
    siteInformation: z.string().optional(),
    policyDocument: z.string().optional(),
});

// ==========================================
// Update Site
// ==========================================
export const updateSiteSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    address: z.string().min(1).optional(),
    postcode: z.string().min(1).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().min(1).optional(),
    validityStart: z.string().optional(),
    validityEnd: z.string().optional().nullable(),
    autoApprove: z.boolean().optional(),
    exclusiveUse: z.boolean().optional(),
    emergencyRecoveryEnabled: z.boolean().optional(),
    clzEnabled: z.boolean().optional(),
    toalAccessFee: z.number().optional(),
    clzAccessFee: z.number().optional(),
    hourlyRate: z.number().optional(),
    cancellationFeePercentage: z.number().optional(),
    geometry: geometrySchema.optional(),
    clzGeometry: geometrySchema.optional(),
    geometryMetadata: z.record(z.string(), z.unknown()).optional(),
    siteInformation: z.string().optional(),
});

// ==========================================
// Update Site Status
// ==========================================
export const updateSiteStatusSchema = z.object({
    status: z.enum([
        "UNDER_REVIEW",
        "ACTIVE",
        "DISABLE",
        "TEMPORARY_RESTRICTED",
        "REJECTED",
        "WITHDRAWN",
    ]),
});

// ==========================================
// Upload URL Request
// ==========================================
export const uploadUrlSchema = z.object({
    fileName: z.string().min(1, "File name is required"),
    contentType: z.string().min(1, "Content type is required"),
    documentType: z.enum(["policy", "ownership", "photo"]).optional(),
    siteId: z.string().optional(), // Optional — may not exist yet for new sites
});

// ==========================================
// Create Document Record
// ==========================================
export const createDocumentSchema = z.object({
    fileKey: z.string().min(1, "File key is required"),
    fileName: z.string().min(1, "File name is required"),
    fileSize: z.string().optional(),
    documentType: z.enum(["policy", "ownership", "photo"]).optional(),
});
