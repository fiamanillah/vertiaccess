export interface PaymentCard {
    id: string;
    stripePaymentMethodId: string;
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault: boolean;
    addedAt: string;
}

export interface WithdrawalMethod {
    connected: boolean;
    provider: string;
    currency: string;
    lastSyncedAt: string | null;
}

export interface OperatorIdentityDoc {
    type: string;
    fileKey: string;
    fileName: string;
    fileUrl: string;
}

export interface OperatorSupportingDoc {
    fileKey: string;
    fileName: string;
    uploadedAt: string;
}
