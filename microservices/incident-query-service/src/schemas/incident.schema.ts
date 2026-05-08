import { z } from 'zod';

export const incidentTypeSchema = z.enum([
    'breach_of_conditions',
    'damage_observed',
    'unapproved_flight',
    'safety_concern',
    'public_complaint',
    'noise_issue',
    'hard_landing',
    'emergency_recovery_usage',
    'emergency_clz_usage',
    'property_damage',
    'injury',
    'near_miss',
    'site_access_issue',
    'landowner_dispute',
    'third_party_complaint',
    'other',
]);

export const createIncidentSchema = z.object({
    siteId: z.string().min(1, 'Site ID is required'),
    bookingId: z.string().min(1).optional(),
    type: incidentTypeSchema,
    urgency: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
    description: z.string().min(1, 'Description is required'),
    incidentDateTime: z.string().optional().nullable(),
    insuranceNotified: z.boolean().optional(),
    immediateActionTaken: z.string().optional().nullable(),
    estimatedDamage: z.number().optional().nullable(),
    status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED']).optional(),
});

export const updateIncidentStatusSchema = z.object({
    status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED']),
    adminNotes: z.string().optional(),
});

export const createIncidentMessageSchema = z.object({
    messageText: z.string().min(1, 'Message text is required'),
});

export const createIncidentDocumentSchema = z.object({
    fileName: z.string().min(1, 'File name is required'),
    documentType: z.string().min(1, 'Document type is required'),
    fileSize: z.string().optional(),
    fileKey: z.string().optional(),
});
