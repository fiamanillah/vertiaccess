import * as z from 'zod';

export const uploadedFileMetadataSchema = z.object({
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    category: z.string(),
    url: z.string(),
});

export type UploadedFileMetadata = z.infer<typeof uploadedFileMetadataSchema>;

export const formSchema = z.object({
    // Stage 1: Site Details
    name: z.string().min(2, 'Site name must be at least 2 characters.'),
    category: z.string().min(1, 'Please select a site category.'),
    siteType: z.string().min(1, 'Please select a primary function.'),
    description: z.string().optional(),
    photoUrls: z.array(uploadedFileMetadataSchema).optional(),
    contactEmail: z.string().email('Please enter a valid email address.'),
    contactPhone: z.string().min(10, 'Please enter a valid contact phone number.'),

    // Stage 2: Location
    address: z.string().min(5, 'Please enter a full address.'),
    postcode: z.string().min(3, 'Please enter a valid postcode.'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    // TOAL boundary
    toalGeometryMode: z.enum(['circle', 'polygon']).optional(),
    toalRadius: z.number().optional(),
    toalPolygonPoints: z.array(z.tuple([z.number(), z.number()])).optional(),
    toalAreaM2: z.number().optional(),
    // Emergency boundary
    allowEmergencyLanding: z.boolean().optional(),
    emergencyGeometryMode: z.enum(['circle', 'polygon']).optional(),
    emergencyRadius: z.number().optional(),
    emergencyPolygonPoints: z.array(z.tuple([z.number(), z.number()])).optional(),
    emergencyAreaM2: z.number().optional(),

    // Stage 3: Operational Policy
    activationStartDate: z.string().optional(),
    activationStartTime: z.string().optional(),
    activationEndDate: z.string().optional(),
    activationEndTime: z.string().optional(),
    isPermanentActivation: z.boolean(),
    bookingApprovalModel: z.enum(['auto', 'manual']),
    policyDocuments: z.array(uploadedFileMetadataSchema).optional(),

    // Stage 4: Commercial Setup
    toalFee: z.number().min(0, 'Fee must be at least 0.'),
    emergencyFee: z.number().min(0, 'Fee must be at least 0.'),

    // Stage 5: Proof of Authority
    ownershipDocuments: z.array(uploadedFileMetadataSchema).min(1, 'Please upload at least one proof of ownership.'),
    legalDeclaration: z.boolean().refine(val => val === true, {
        message: 'You must declare that you have the legal authority to register this site.',
    }),
});

export type FormValues = z.infer<typeof formSchema>;

export type DetailedSite = {
    id: string;
    name: string;
    category: string;
    siteType: 'toal' | 'emergency';
    address: string;
    postcode: string;
    latitude: number;
    longitude: number;
    toalRadius: number;
    toalGeometryMode: 'circle' | 'polygon';
    toalPolygonPoints: [number, number][];
    allowEmergencyLanding: boolean;
    emergencyRadius?: number;
    emergencyGeometryMode?: 'circle' | 'polygon';
    emergencyPolygonPoints?: [number, number][];
    contactEmail: string;
    contactPhone: string;
    description: string;
    photoUrls: string[];
    isPermanentActivation: boolean;
    activationStartDate?: string;
    activationEndDate?: string;
    activationStartTime?: string;
    activationEndTime?: string;
    bookingApprovalModel: 'auto' | 'manual';
    policyDocuments: string[];
    toalFee: number;
    emergencyFee: number;
    status: 'active' | 'pending' | 'rejected';
    createdAt: string;
    submissionDate?: string;
    approvalDate?: string;
    rejectionDate?: string;
    reason?: string;
};
