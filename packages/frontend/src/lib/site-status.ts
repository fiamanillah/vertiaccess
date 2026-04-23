import type { SiteStatus } from '../types';

export const SITE_STATUS_VALUES: SiteStatus[] = [
    'UNDER_REVIEW',
    'ACTIVE',
    'DISABLE',
    'TEMPORARY_RESTRICTED',
    'REJECTED',
    'WITHDRAWN',
];

const STATUS_ALIASES: Record<string, SiteStatus> = {
    active: 'ACTIVE',
    approved: 'ACTIVE',
    disable: 'DISABLE',
    disabled: 'DISABLE',
    temporarily_restricted: 'TEMPORARY_RESTRICTED',
    restricted: 'TEMPORARY_RESTRICTED',
    pending_verification: 'UNDER_REVIEW',
    under_review: 'UNDER_REVIEW',
    rejected: 'REJECTED',
    withdrawn: 'WITHDRAWN',
    suspended: 'DISABLE',
};

export const SITE_STATUS_META: Record<
    SiteStatus,
    {
        label: string;
        shortLabel: string;
        badgeClass: string;
        description: string;
    }
> = {
    UNDER_REVIEW: {
        label: 'Under Review',
        shortLabel: 'Reviewing',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-100',
        description: 'Site is being verified and is not yet visible to operators.',
    },
    ACTIVE: {
        label: 'Active',
        shortLabel: 'Active',
        badgeClass: 'bg-green-50 text-green-700 border-green-100',
        description: 'Site is available for bookings and operator discovery.',
    },
    DISABLE: {
        label: 'Disabled',
        shortLabel: 'Disabled',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-100',
        description: 'Site is hidden from new bookings but remains on record.',
    },
    TEMPORARY_RESTRICTED: {
        label: 'Temporarily Restricted',
        shortLabel: 'Restricted',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
        description: 'Site is temporarily unavailable because of an issue or restriction.',
    },
    REJECTED: {
        label: 'Rejected',
        shortLabel: 'Rejected',
        badgeClass: 'bg-red-50 text-red-700 border-red-100',
        description: 'Site verification was rejected and needs changes before resubmission.',
    },
    WITHDRAWN: {
        label: 'Withdrawn',
        shortLabel: 'Withdrawn',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-100',
        description: 'Application was withdrawn by the landowner or operator.',
    },
};

export function normalizeSiteStatus(status?: string | null): SiteStatus {
    if (!status) return 'UNDER_REVIEW';

    const key = status.trim().toLowerCase();
    const alias = STATUS_ALIASES[key];

    if (alias) return alias;
    if (SITE_STATUS_VALUES.includes(status as SiteStatus)) return status as SiteStatus;

    return 'UNDER_REVIEW';
}

export function formatSiteStatusLabel(status?: string | null): string {
    return SITE_STATUS_META[normalizeSiteStatus(status)].label;
}

export function isWithdrawableSite(status?: string | null): boolean {
    return normalizeSiteStatus(status) === 'UNDER_REVIEW';
}
