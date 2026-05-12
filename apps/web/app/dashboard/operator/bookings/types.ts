export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type UseCategory = 'planned_toal' | 'emergency_recovery';

export interface Booking {
    id: string;
    vtId: string | null;
    bookingReference: string;
    operatorId: string;
    siteId: string;
    siteName: string;
    siteAddress: string;
    sitePhotoUrl: string | null;
    latitude: number;
    longitude: number;
    toalRadius: number;
    emergencyRadius: number;
    showEmergency: boolean;
    toalMode: 'circle' | 'polygon';
    emergencyMode: 'circle' | 'polygon';
    toalPolygonPoints?: [number, number][];
    emergencyPolygonPoints?: [number, number][];
    startTime: string;
    endTime: string;
    operationReference: string;
    droneModel: string;
    missionIntent: string;
    useCategory: UseCategory;
    flyerId: string;
    toalCost: number;
    platformFee: number;
    paymentMethodLast4: string;
    paymentMethodBrand: string;
    status: BookingStatus;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    createdAt: string;
    respondedAt: string | null;
    cancelledAt: string | null;
    adminNote?: string; // Rejection reason
    certificateId?: string;
    certificateUrl?: string;
}
