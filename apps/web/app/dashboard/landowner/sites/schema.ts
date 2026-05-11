import * as z from 'zod';

export const formSchema = z.object({
    // Stage 1: Site Details
    name: z.string().min(2, 'Site name must be at least 2 characters.'),
    category: z.string().min(1, 'Please select a site category.'),
    siteType: z.string().min(1, 'Please select a primary function.'),
    description: z.string().optional(),
    photoUrls: z.array(z.string()).optional(),
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
    policyDocuments: z.array(z.string()).optional(),

    // Stage 4: Commercial Setup
    toalFee: z.number().min(0, 'Fee must be at least 0.'),
    emergencyFee: z.number().min(0, 'Fee must be at least 0.'),

    // Stage 5: Proof of Authority
    ownershipDocuments: z.array(z.string()).min(1, 'Please upload at least one proof of ownership.'),
    legalDeclaration: z.boolean().refine(val => val === true, {
        message: 'You must declare that you have the legal authority to register this site.',
    }),
});

export type FormValues = z.infer<typeof formSchema>;
