export type SiteStatus =
    | 'UNDER_REVIEW'
    | 'ACTIVE'
    | 'DISABLE'
    | 'TEMPORARY_RESTRICTED'
    | 'REJECTED'
    | 'WITHDRAWN';
export type BookingStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type GeometryType = 'circle' | 'polygon';
export type PaymentStatus =
    | 'pending'
    | 'charged'
    | 'refunded'
    | 'cancelled_no_charge'
    | 'cancelled_partial'
    | 'cancelled_full';
export type SiteCategory =
    | 'private_land'
    | 'helipad'
    | 'vertiport'
    | 'droneport'
    | 'temporary_landing_site';
export type SiteType = 'toal' | 'emergency'; // Type of site: Takeoff and Landing Zone or Emergency/Recovery Site
export type AccountStatus = 'UNVERIFIED' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';

export interface PaymentCard {
    id?: string;
    stripePaymentMethodId?: string;
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault?: boolean;
    addedAt: string;
}

export interface Service {
    id: string;
    name: string;
    category: string;
    description: string;
    price: string;
    unit: string; // e.g., "per booking", "per hour", "per day"
}

export interface ServiceTier {
    id: string;
    tierName: string;
    services: Service[];
}

export interface Site {
    id: string;
    vtId?: string; // vt-site-xxxxxx display reference
    landownerId: string;
    landownerName?: string;
    name: string;
    description?: string;
    siteType?: SiteType; // toal or clz
    siteCategory?: SiteCategory; // private_land, helipad, vertiport, etc.
    address: string;
    postcode?: string;
    contactEmail: string;
    contactPhone: string;
    geometry: {
        type: GeometryType;
        center?: { lat: number; lng: number };
        radius?: number;
        points?: { lat: number; lng: number }[];
        heightAGL?: number; // Height Above Ground Level in meters (for helipad/vertiport)
    };
    clzGeometry?: {
        type: GeometryType;
        center?: { lat: number; lng: number };
        radius?: number;
        points?: { lat: number; lng: number }[];
        heightAGL?: number;
    };
    validityStart: string;
    validityEnd?: string;
    autoApprove: boolean;
    exclusiveUse: boolean;
    emergencyRecoveryEnabled: boolean;
    clzEnabled: boolean;
    pricing?: {
        hourlyRate: number;
        currency: string;
        cancellationFeePercentage: number; // For 24h-2h window
    };
    services?: Service[]; // Individual optional services (for droneport, helipad, vertiport)
    status: SiteStatus;
    photoUrl?: string;
    adminNote?: string;
    adminInternalNote?: string;
    rejectionReasonNote?: string;
    toalAccessFee?: number;
    clzAccessFee?: number;
    policyText?: string;
    policyDocument?: string;
    policyDocuments?: string[];
    ownershipDocuments?: string[];
    siteInformation?: string;
    authorizedToGrantAccess?: boolean;
    acceptedLandownerDeclaration?: boolean;
    sitePhotos?: string[];
    documents: string[];
    documentDetails?: {
        id: string;
        fileName: string;
        fileKey: string;
        documentType?: string;
        downloadUrl?: string;
        uploadedAt?: string;
    }[];
    createdAt: string;
    // Operator details (if assigned or relevant to this view)
    operatorId?: string;
    operatorName?: string;
    operatorEmail?: string;
    operatorPhone?: string;
    operatorReference?: string;
    flyerId?: string;
}

export interface ProvidedDocument {
    name: string;
    type: string;
    fileName: string;
    fileSize: string;
    uploadedAt: string;
}

export interface BookingRequest {
    id: string;
    vtId?: string; // vt-bkg-xxxxxx display reference
    siteId: string;
    siteName: string;
    siteStatus?: SiteStatus; // Current status of the site
    operatorId: string;
    operatorName?: string;
    operatorEmail: string;
    operatorPhone?: string;
    operatorOrganisation?: string;
    startTime: string;
    endTime: string;
    operationReference: string;
    droneModel: string;
    flyerId: string;
    missionIntent: string;
    status: BookingStatus;
    billingMode?: 'payg' | 'subscription';
    billingPlanName?: string;
    useCategory?: 'planned_toal' | 'emergency_recovery'; // What the operator chose
    clzUsed?: boolean;
    clzConfirmedAt?: string;
    operationType?: 'standard' | 'bvlos'; // For PAYG users
    isPAYG?: boolean; // New: track if this was a PAYG booking
    platformFee?: number; // Platform service fee (£25 or £90 for PAYG, 0 for subs)
    toalCost?: number; // Landowner access fee
    // Payment card snapshot — masked display (PAYG bookings only)
    paymentMethodLast4?: string; // e.g. "4242"
    paymentMethodBrand?: string; // e.g. "visa"
    providedDocuments?: ProvidedDocument[];
    pricing?: {
        amount: number;
        currency: string;
    };
    paymentStatus?: PaymentStatus;
    cancelledAt?: string;
    cancellationFee?: number;
    createdAt: string;
    respondedAt?: string;
    // Certificate info if booking is approved
    certificateVtId?: string; // vt-cert-XXXXX
    certificateId?: string; // raw UUID of the certificate record
}

export interface CLZSelection {
    id: string;
    bookingDbId?: string;
    operatorId: string;
    siteId: string;
    siteName: string;
    operationStartDate?: string;
    operationStartTime?: string;
    operationEndDate?: string;
    operationEndTime?: string;
    droneModel: string;
    flyerId: string;
    missionIntent: string;
    createdAt: string;
    clzUsed?: boolean | null; // null = not confirmed yet, true = used, false = not used
    clzConfirmedAt?: string;
    isPAYG?: boolean;
    paymentStatus?: PaymentStatus;
    totalCost?: number;
}

export interface ConsentCertificate {
    // Certificate Identification
    id: string; // UUID4 certificate reference
    vtId?: string; // vt-cert-xxxxxx human-readable certificate ID
    certificateType: string; // "Digital Land Access Consent"
    issueDate: string; // UTC timestamp
    platformName: string; // "VertiAccess"
    verificationUrl: string;
    verificationHash: string;

    // Landowner / Authority Details
    landownerName: string;
    landownerEmail: string;
    landownerPhone: string;
    authorityDeclaration: boolean;

    // Site Information
    siteId: string;
    siteName: string;
    siteType: SiteType;
    siteAddress: string;
    siteGeometry: {
        type: GeometryType;
        center?: { lat: number; lng: number };
        radius?: number;
        points?: { lat: number; lng: number }[];
        heightAGL?: number; // Height Above Ground Level in meters (for helipad/vertiport)
    };
    siteGeometrySize: string; // "50m radius" or "Polygon area: 2500m²"
    siteCoordinates: string; // Formatted coordinate string
    clzGeometry?: {
        type: GeometryType;
        center?: { lat: number; lng: number };
        radius?: number;
        points?: { lat: number; lng: number }[];
        heightAGL?: number;
    }; // Optional Emergency/Recovery boundary (larger than TOAL)
    heightAgl?: number; // Site height AGL

    // Operator Information
    operatorName: string;
    operatorOrganisation?: string;
    operatorEmail: string;
    operationReference: string;
    flyerId?: string; // UAS registration or internal operator ID
    droneModel?: string;
    missionIntent?: string;

    // Authorised Use & Permissions
    startTime: string;
    endTime: string;
    permittedActivities: string[]; // ["Take-off", "Landing", "Recovery"]
    useCategory: 'planned_toal' | 'emergency_recovery';
    exclusiveUse: boolean;
    autoApprovalEnabled: boolean;
    consentStatus?: BookingStatus; // Current status: approved, rejected, blocked_site_issue, etc.
    statusHistory?: Array<{
        status: BookingStatus | SiteStatus;
        timestamp: string;
        reason?: string;
    }>; // Track all status changes with timestamps

    // Audit & Integrity Metadata
    createdAt: string; // Certificate creation timestamp
    digitalSignature: string;
    bookingId?: string;
    bookingVtId?: string;
    siteStatusAtIssue?: string;
}

export interface PendingVerification {
    id: string; // UUID4
    type: 'landowner' | 'site' | 'operator' | 'identity';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    userId?: string;
    userEmail?: string;
    userName?: string;
    userOrganisation?: string;
    userVerificationStatus?: AccountStatus;
    flyerId?: string; // For operator verification
    operatorCredentials?: string; // For operator verification

    // Site verification fields
    siteId?: string;
    siteName?: string;
    siteType?: SiteType;
    siteCategory?: SiteCategory;
    siteAddress?: string;
    sitePostcode?: string;
    siteGeometry?: {
        type: GeometryType;
        center?: { lat: number; lng: number };
        radius?: number;
        points?: { lat: number; lng: number }[];
        heightAGL?: number; // Height Above Ground Level in meters (for helipad/vertiport)
    };
    clzGeometry?: {
        type: GeometryType;
        center?: { lat: number; lng: number };
        radius?: number;
        points?: { lat: number; lng: number }[];
        heightAGL?: number; // Height Above Ground Level in meters (for helipad/vertiport)
    };
    siteCoordinates?: string;
    siteGeometrySize?: string;
    operationWindowStart?: string;
    operationWindowEnd?: string;
    contactEmail?: string;
    contactPhone?: string;
    validityStart?: string;
    validityEnd?: string;
    siteInformation?: string;
    toalOnly?: boolean; // true = TOAL only, false = includes Emergency/Recovery
    exclusiveUse?: boolean;
    autoApprove?: boolean;
    authorizedToGrantAccess?: boolean; // Landowner authorization flag
    acceptedLandownerDeclaration?: boolean; // Landowner declaration T&C acceptance
    submittedByVerified?: boolean; // Is the submitting user already verified?
    adminInternalNote?: string;
    rejectionReasonNote?: string;
    toalAccessFee?: number;
    clzAccessFee?: number;
    submittedDocuments?: {
        fileName?: string;
        fileKey?: string;
        documentType?: string;
        downloadUrl?: string;
        uploadedAt?: string;
    }[];
    policyDocuments?: string[];
    ownershipDocuments?: string[];
    sitePhotos?: string[];

    documents: string[];
    createdAt: string;
}

export type IncidentType =
    | 'breach_of_conditions'
    | 'damage_observed'
    | 'unapproved_flight'
    | 'safety_concern'
    | 'public_complaint'
    | 'noise_issue'
    | 'hard_landing'
    | 'emergency_recovery_usage'
    | 'property_damage'
    | 'injury'
    | 'near_miss'
    | 'site_access_issue'
    | 'landowner_dispute'
    | 'third_party_complaint'
    | 'other';
export type IncidentUrgency = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface IncidentMessage {
    role: 'admin' | 'operator' | 'landowner';
    sender: string;
    text: string;
    timestamp: string;
}

export interface RelatedDocument {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedAt: string;
    uploadedBy: string;
}

export interface ManagedUser {
    id: string;
    email: string;
    name: string;
    role: 'landowner' | 'operator';
    organisation?: string;
    verificationStatus: AccountStatus;
    verifiedDate: string;
    totalSites?: number;
    activeSites?: number;
    totalBookings?: number;
    suspendedDate?: string;
    suspendedReason?: string;
    internalNotes?: string[];
    flyerId?: string;
    address?: string;
    postcode?: string;
    phone?: string;
}

export interface IncidentReport {
    id: string;
    landownerId: string;
    landownerName: string;
    siteId: string;
    siteName: string;
    bookingId?: string;
    operatorId?: string;
    operatorName?: string;
    type: IncidentType;
    description: string;
    urgency: IncidentUrgency;
    estimatedDamage?: number;
    photos?: string[];
    status: IncidentStatus;
    adminNotes?: string;
    messages?: IncidentMessage[];
    relatedDocumentation?: RelatedDocument[];
    createdAt: string;
    resolvedAt?: string;
    incidentDateTime?: string;
    insuranceNotified?: boolean;
    immediateActionTaken?: string;
}
