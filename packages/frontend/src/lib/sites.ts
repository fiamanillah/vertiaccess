// src/lib/sites.ts — API client for the site-service
import type { Site, SiteStatus } from '../types';
import { normalizeSiteStatus } from './site-status';
import { getApiBaseUrl } from './api';

// ==========================================
// Site types
// ==========================================

export interface CreateSitePayload {
    name: string;
    description?: string;
    siteType?: 'toal' | 'emergency';
    siteCategory?: string;
    address: string;
    postcode: string;
    contactEmail: string;
    contactPhone: string;
    geometry: {
        type: 'circle' | 'polygon';
        center?: { lat: number; lng: number };
        radius?: number;
        points?: { lat: number; lng: number }[];
        heightAGL?: number;
    };
    clzGeometry?: {
        type: 'circle' | 'polygon';
        center?: { lat: number; lng: number };
        radius?: number;
        points?: { lat: number; lng: number }[];
        heightAGL?: number;
    };
    geometryMetadata?: Record<string, unknown>;
    validityStart: string;
    validityEnd?: string | null;
    autoApprove: boolean;
    exclusiveUse: boolean;
    emergencyRecoveryEnabled: boolean;
    clzEnabled: boolean;
    toalAccessFee?: number;
    clzAccessFee?: number;
    hourlyRate?: number;
    cancellationFeePercentage?: number;
    documents?: {
        fileKey: string;
        fileName: string;
        fileSize?: string;
        documentType?: 'policy' | 'ownership' | 'photo';
    }[];
    siteInformation?: string;
    policyDocument?: string;
}

export interface ApiSiteDocument {
    id: string;
    fileKey: string;
    fileName: string | null;
    fileSize: string | null;
    documentType: string | null;
    downloadUrl?: string;
    uploadedAt: string;
}

export interface ApiSite {
    id: string;
    landownerId: string;
    siteReference: string | null;
    name: string;
    description: string | null;
    siteType: string | null;
    siteCategory: string | null;
    address: string;
    postcode: string;
    contactEmail: string;
    contactPhone: string;
    validityStart: string;
    validityEnd: string | null;
    autoApprove: boolean;
    exclusiveUse: boolean;
    emergencyRecoveryEnabled: boolean;
    clzEnabled: boolean;
    geometry: any;
    clzGeometry: any;
    toalAccessFee: number | null;
    clzAccessFee: number | null;
    hourlyRate: number | null;
    cancellationFeePercentage: number | null;
    currency: string;
    status: string;
    siteInformation: string | null;
    photoUrl: string | null;
    documents: ApiSiteDocument[];
    createdAt: string;
}

// ==========================================
// Helper: convert API site to frontend Site type
// ==========================================

export function apiSiteToFrontendSite(apiSite: ApiSite): Site {
    return {
        id: apiSite.id,
        landownerId: apiSite.landownerId,
        name: apiSite.name,
        description: apiSite.description || undefined,
        siteType: (apiSite.siteType as any) || undefined,
        siteCategory: (apiSite.siteCategory as any) || undefined,
        address: apiSite.address,
        postcode: apiSite.postcode || undefined,
        contactEmail: apiSite.contactEmail,
        contactPhone: apiSite.contactPhone,
        geometry: apiSite.geometry || { type: 'circle' },
        clzGeometry: apiSite.clzGeometry || undefined,
        validityStart: apiSite.validityStart,
        validityEnd: apiSite.validityEnd || undefined,
        autoApprove: apiSite.autoApprove,
        exclusiveUse: apiSite.exclusiveUse,
        emergencyRecoveryEnabled: apiSite.emergencyRecoveryEnabled,
        clzEnabled: apiSite.clzEnabled,
        toalAccessFee: apiSite.toalAccessFee ?? undefined,
        clzAccessFee: apiSite.clzAccessFee ?? undefined,
        status: normalizeSiteStatus(apiSite.status),
        photoUrl: apiSite.photoUrl || undefined,
        sitePhotos:
            apiSite.documents
                ?.filter(d => d.documentType === 'photo' && d.downloadUrl)
                .map(d => d.downloadUrl!) || (apiSite.photoUrl ? [apiSite.photoUrl] : []),
        policyDocuments:
            apiSite.documents
                ?.filter(d => d.documentType === 'policy')
                .map(d => d.fileName || d.fileKey) || [],
        ownershipDocuments:
            apiSite.documents
                ?.filter(d => d.documentType === 'ownership')
                .map(d => d.fileName || d.fileKey) || [],
        siteInformation: apiSite.siteInformation || undefined,
        documents: apiSite.documents?.map(d => d.fileName || d.fileKey) || [],
        documentDetails:
            apiSite.documents?.map(d => ({
                id: d.id,
                fileName: d.fileName || d.fileKey,
                fileKey: d.fileKey,
                documentType: d.documentType || undefined,
                downloadUrl: d.downloadUrl,
                uploadedAt: d.uploadedAt,
            })) || [],
        createdAt: apiSite.createdAt,
    };
}

// ==========================================
// API functions
// ==========================================

/**
 * Fetch all sites belonging to the authenticated user
 */
export async function fetchMySites(idToken: string): Promise<ApiSite[]> {
    const res = await fetch(`${getApiBaseUrl()}/sites/v1`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch sites');
    return (json?.data || []) as ApiSite[];
}

/**
 * Create a new site
 */
export async function createSite(idToken: string, data: CreateSitePayload): Promise<ApiSite> {
    const res = await fetch(`${getApiBaseUrl()}/sites/v1`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to create site');
    return json?.data as ApiSite;
}

/**
 * Update a site's details
 */
export async function updateSite(
    idToken: string,
    siteId: string,
    data: Partial<CreateSitePayload>
): Promise<ApiSite> {
    const res = await fetch(`${getApiBaseUrl()}/sites/v1/${siteId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to update site');
    return json?.data as ApiSite;
}

/**
 * Update a site's status
 */
export async function updateSiteStatus(
    idToken: string,
    siteId: string,
    status: SiteStatus,
    adminNote?: string
): Promise<ApiSite> {
    const res = await fetch(`${getApiBaseUrl()}/sites/v1/${siteId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status, ...(adminNote ? { adminNote } : {}) }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to update site status');
    return json?.data as ApiSite;
}

/**
 * Fetch a single site by ID
 */
export async function fetchSiteById(idToken: string, siteId: string): Promise<ApiSite> {
    const res = await fetch(`${getApiBaseUrl()}/sites/v1/${siteId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch site');
    return json?.data as ApiSite;
}

/**
 * Fetch the documents for a site
 */
export async function fetchSiteDocuments(
    idToken: string,
    siteId: string
): Promise<ApiSiteDocument[]> {
    const res = await fetch(`${getApiBaseUrl()}/sites/v1/${siteId}/documents`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch site documents');
    return (json?.data || []) as ApiSiteDocument[];
}

/**
 * Delete a site (soft delete)
 */
export async function deleteSite(idToken: string, siteId: string): Promise<void> {
    const res = await fetch(`${getApiBaseUrl()}/sites/v1/${siteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to delete site');
}

/**
 * Get a presigned upload URL from S3
 */
export async function getUploadUrl(
    idToken: string,
    params: {
        fileName: string;
        contentType: string;
        documentType?: 'policy' | 'ownership' | 'photo';
        siteId?: string;
    }
): Promise<{ uploadUrl: string; fileKey: string }> {
    const res = await fetch(`${getApiBaseUrl()}/sites/v1/upload-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to get upload URL');
    return json?.data as { uploadUrl: string; fileKey: string };
}

/**
 * Upload a file directly to S3 using a presigned URL
 */
export async function uploadFileToS3(presignedUrl: string, file: File): Promise<void> {
    try {
        const res = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type || 'application/octet-stream',
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to upload file to S3 (HTTP ${res.status})`);
        }
    } catch (error: any) {
        if (error instanceof TypeError) {
            throw new Error(
                'S3 upload failed due to network/CORS. Ensure the bucket CORS allows PUT from your frontend origin.'
            );
        }

        throw error;
    }
}

/**
 * Upload file through backend as a fallback when browser-to-S3 PUT is blocked by CORS.
 */
export async function uploadFileViaApi(
    idToken: string,
    file: File,
    documentType: 'policy' | 'ownership' | 'photo',
    siteId?: string
): Promise<{ fileKey: string; fileName: string; fileSize: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (siteId) {
        formData.append('siteId', siteId);
    }

    const res = await fetch(`${getApiBaseUrl()}/sites/v1/upload-file`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
        body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
        throw new Error(json?.message || 'Failed to upload file via API');
    }

    return json?.data as { fileKey: string; fileName: string; fileSize: string };
}

/**
 * Register a document after uploading to S3
 */
export async function registerDocument(
    idToken: string,
    siteId: string,
    data: {
        fileKey: string;
        fileName: string;
        fileSize?: string;
        documentType?: 'policy' | 'ownership' | 'photo';
    }
): Promise<ApiSiteDocument> {
    const res = await fetch(`${getApiBaseUrl()}/sites/v1/${siteId}/documents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to register document');
    return json?.data as ApiSiteDocument;
}

/**
 * Delete a document from a site
 */
export async function deleteDocument(
    idToken: string,
    siteId: string,
    docId: string
): Promise<void> {
    const res = await fetch(`${getApiBaseUrl()}/sites/v1/${siteId}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to delete document');
}

/**
 * Upload a file and register it as a document for a site.
 * Returns the fileKey and document metadata.
 */
export async function uploadAndRegisterFile(
    idToken: string,
    file: File,
    siteId: string | undefined,
    documentType: 'policy' | 'ownership' | 'photo'
): Promise<{ fileKey: string; fileName: string; fileSize: string }> {
    // 1. Get presigned URL
    const { uploadUrl, fileKey } = await getUploadUrl(idToken, {
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        documentType,
        siteId,
    });

    // 2. Upload to S3 (fallback to backend upload if browser CORS blocks direct PUT)
    let effectiveFileKey = fileKey;
    try {
        await uploadFileToS3(uploadUrl, file);
    } catch (error: any) {
        const message = String(error?.message || '');
        if (message.includes('network/CORS')) {
            const uploaded = await uploadFileViaApi(idToken, file, documentType, siteId);
            effectiveFileKey = uploaded.fileKey;
        } else {
            throw error;
        }
    }

    // 3. Register document if siteId exists
    if (siteId) {
        await registerDocument(idToken, siteId, {
            fileKey: effectiveFileKey,
            fileName: file.name,
            fileSize: `${file.size}`,
            documentType,
        });
    }

    return {
        fileKey: effectiveFileKey,
        fileName: file.name,
        fileSize: `${file.size}`,
    };
}

/**
 * Fetch public sites (no auth required, for discovery map)
 */
export async function fetchPublicSites(): Promise<ApiSite[]> {
    const res = await fetch(`${getApiBaseUrl()}/sites/v1/public`);
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch public sites');
    return (json?.data || []) as ApiSite[];
}
