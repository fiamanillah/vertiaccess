import { getApiBaseUrl } from './api';
import type {
    IncidentMessage,
    IncidentReport,
    IncidentStatus,
    IncidentUrgency,
    IncidentType,
    RelatedDocument,
} from '../types';

export interface CreateIncidentPayload {
    siteId: string;
    bookingId?: string;
    type: IncidentType;
    urgency: IncidentUrgency;
    description: string;
    incidentDateTime?: string | null;
    insuranceNotified?: boolean;
    immediateActionTaken?: string | null;
    estimatedDamage?: number | null;
    status?: IncidentStatus;
}

export interface CreateIncidentMessagePayload {
    messageText: string;
}

export interface CreateIncidentDocumentPayload {
    fileName: string;
    documentType: string;
    fileSize?: string;
    fileKey?: string;
}

export interface ApiIncidentMessage {
    id: string;
    role: 'admin' | 'operator' | 'landowner';
    sender: string;
    text: string;
    timestamp: string;
}

export interface ApiIncidentDocument {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedAt: string;
    uploadedBy: string;
}

export interface ApiIncident {
    id: string;
    landownerId: string | null;
    landownerName: string;
    siteId: string;
    siteName: string;
    bookingId?: string;
    operatorId: string | null;
    operatorName?: string;
    type: IncidentType;
    description: string;
    urgency: IncidentUrgency;
    estimatedDamage?: number;
    status: IncidentStatus;
    adminNotes?: string;
    messages: ApiIncidentMessage[];
    relatedDocumentation: ApiIncidentDocument[];
    createdAt: string;
    resolvedAt?: string;
    incidentDateTime?: string;
    insuranceNotified: boolean;
    immediateActionTaken?: string;
    reporterId: string;
}

function normalizeIncidentResponse<T>(response: Response): Promise<T> {
    return response.json().then(json => {
        if (!response.ok) {
            throw new Error(json?.message || 'Request failed');
        }

        return (json?.data ?? json) as T;
    });
}

function buildHeaders(idToken: string): HeadersInit {
    return {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
    };
}

function mapIncidentMessage(message: ApiIncidentMessage): IncidentMessage {
    return {
        role: message.role,
        sender: message.sender,
        text: message.text,
        timestamp: message.timestamp,
    };
}

function mapRelatedDocument(document: ApiIncidentDocument): RelatedDocument {
    return {
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.size,
        uploadedAt: document.uploadedAt,
        uploadedBy: document.uploadedBy,
    };
}

export function apiIncidentToFrontendIncident(incident: ApiIncident): IncidentReport {
    return {
        id: incident.id,
        landownerId: incident.landownerId || '',
        landownerName: incident.landownerName || 'Unknown',
        siteId: incident.siteId,
        siteName: incident.siteName || 'Unknown Site',
        bookingId: incident.bookingId || undefined,
        operatorId: incident.operatorId || undefined,
        operatorName: incident.operatorName || undefined,
        type: incident.type,
        description: incident.description,
        urgency: incident.urgency,
        estimatedDamage: incident.estimatedDamage || undefined,
        photos: [],
        status: incident.status,
        adminNotes: incident.adminNotes || undefined,
        messages: (incident.messages || []).map(mapIncidentMessage),
        relatedDocumentation: (incident.relatedDocumentation || []).map(mapRelatedDocument),
        createdAt: incident.createdAt,
        resolvedAt: incident.resolvedAt || undefined,
        incidentDateTime: incident.incidentDateTime || undefined,
        insuranceNotified: incident.insuranceNotified,
        immediateActionTaken: incident.immediateActionTaken || undefined,
    };
}

export function frontendIncidentToCreatePayload(incident: IncidentReport): CreateIncidentPayload {
    return {
        siteId: incident.siteId,
        bookingId: incident.bookingId,
        type: incident.type,
        urgency: incident.urgency,
        description: incident.description,
        incidentDateTime: incident.incidentDateTime || null,
        insuranceNotified: incident.insuranceNotified,
        immediateActionTaken: incident.immediateActionTaken || null,
        estimatedDamage: incident.estimatedDamage ?? null,
        status: incident.status,
    };
}

async function fetchIncidentList(idToken: string, path = '/incidents/v1'): Promise<ApiIncident[]> {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        headers: buildHeaders(idToken),
    });

    return normalizeIncidentResponse<ApiIncident[]>(response);
}

export async function apiFetchIncidents(idToken: string): Promise<ApiIncident[]> {
    return fetchIncidentList(idToken);
}

export async function apiFetchMyIncidents(idToken: string): Promise<ApiIncident[]> {
    return fetchIncidentList(idToken, '/incidents/v1/mine');
}

export async function apiFetchSiteIncidents(
    idToken: string,
    siteId: string
): Promise<ApiIncident[]> {
    return fetchIncidentList(idToken, `/incidents/v1/site/${siteId}`);
}

export async function apiGetIncident(idToken: string, incidentId: string): Promise<ApiIncident> {
    const response = await fetch(`${getApiBaseUrl()}/incidents/v1/${incidentId}`, {
        headers: buildHeaders(idToken),
    });

    return normalizeIncidentResponse<ApiIncident>(response);
}

export async function apiCreateIncident(
    idToken: string,
    payload: CreateIncidentPayload
): Promise<ApiIncident> {
    const response = await fetch(`${getApiBaseUrl()}/incidents/v1`, {
        method: 'POST',
        headers: buildHeaders(idToken),
        body: JSON.stringify(payload),
    });

    return normalizeIncidentResponse<ApiIncident>(response);
}

export async function apiUpdateIncidentStatus(
    idToken: string,
    incidentId: string,
    status: IncidentStatus,
    adminNotes?: string
): Promise<ApiIncident> {
    const response = await fetch(`${getApiBaseUrl()}/incidents/v1/${incidentId}/status`, {
        method: 'PATCH',
        headers: buildHeaders(idToken),
        body: JSON.stringify({ status, ...(adminNotes ? { adminNotes } : {}) }),
    });

    return normalizeIncidentResponse<ApiIncident>(response);
}

export async function apiAddIncidentMessage(
    idToken: string,
    incidentId: string,
    messageText: string
): Promise<ApiIncident> {
    const response = await fetch(`${getApiBaseUrl()}/incidents/v1/${incidentId}/messages`, {
        method: 'POST',
        headers: buildHeaders(idToken),
        body: JSON.stringify({ messageText }),
    });

    return normalizeIncidentResponse<ApiIncident>(response);
}

export async function apiAddIncidentDocument(
    idToken: string,
    incidentId: string,
    payload: CreateIncidentDocumentPayload
): Promise<ApiIncident> {
    const response = await fetch(`${getApiBaseUrl()}/incidents/v1/${incidentId}/documents`, {
        method: 'POST',
        headers: buildHeaders(idToken),
        body: JSON.stringify(payload),
    });

    return normalizeIncidentResponse<ApiIncident>(response);
}
