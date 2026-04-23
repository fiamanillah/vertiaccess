import { useState } from 'react';
import type { Site, SiteStatus } from '../types';
import { X, AlertTriangle, CheckCircle, Ban, Clock } from 'lucide-react';
import { SITE_STATUS_META, normalizeSiteStatus } from '../lib/site-status';

interface SiteStatusModalProps {
    site: Site;
    onClose: () => void;
    onUpdateStatus: (siteId: string, newStatus: SiteStatus) => void;
}

export function SiteStatusModal({ site, onClose, onUpdateStatus }: SiteStatusModalProps) {
    const currentStatus = normalizeSiteStatus(site.status);
    const [selectedStatus, setSelectedStatus] = useState<SiteStatus>(currentStatus);
    const [restrictionReason, setRestrictionReason] = useState('');

    const statusOptions: {
        value: SiteStatus;
        label: string;
        description: string;
        icon: any;
        color: string;
    }[] = [
        {
            value: 'ACTIVE',
            label: SITE_STATUS_META.ACTIVE.label,
            description: SITE_STATUS_META.ACTIVE.description,
            icon: CheckCircle,
            color: 'green',
        },
        {
            value: 'DISABLE',
            label: SITE_STATUS_META.DISABLE.label,
            description: SITE_STATUS_META.DISABLE.description,
            icon: Ban,
            color: 'gray',
        },
        {
            value: 'TEMPORARY_RESTRICTED',
            label: SITE_STATUS_META.TEMPORARY_RESTRICTED.label,
            description: SITE_STATUS_META.TEMPORARY_RESTRICTED.description,
            icon: AlertTriangle,
            color: 'amber',
        },
    ];

    const handleConfirm = () => {
        if (currentStatus === 'UNDER_REVIEW') return;
        onUpdateStatus(site.id, selectedStatus);
        onClose();
    };

    const getImpactMessage = () => {
        if (selectedStatus === currentStatus) return null;

        if (selectedStatus === 'DISABLE') {
            return {
                type: 'warning',
                title: 'Disabling Site',
                message:
                    'This will prevent new TOAL bookings and Emergency and Recovery Site selections. All existing approved bookings will remain active.',
            };
        }

        if (selectedStatus === 'TEMPORARY_RESTRICTED') {
            return {
                type: 'error',
                title: 'Restricting Site',
                message:
                    'This will immediately block new bookings. Any approved TOAL bookings overlapping with the restriction period will be moved to "Blocked – Site Issue". Affected operators will be notified and refunded. The landowner will not receive payment for blocked bookings.',
            };
        }

        if (selectedStatus === 'ACTIVE') {
            return {
                type: 'success',
                title: 'Activating Site',
                message:
                    'This will make the site available for new TOAL bookings and Emergency and Recovery Site selections.',
            };
        }

        return null;
    };

    const impact = getImpactMessage();

    return (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.51)] bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="mb-1">Change Site Status</h2>
                        <p className="text-sm text-gray-600">{site.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Current Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Current Status</p>
                        <div className="flex items-center gap-2">
                            {currentStatus === 'ACTIVE' && (
                                <CheckCircle className="size-5 text-green-600" />
                            )}
                            {currentStatus === 'DISABLE' && (
                                <Ban className="size-5 text-gray-600" />
                            )}
                            {currentStatus === 'TEMPORARY_RESTRICTED' && (
                                <AlertTriangle className="size-5 text-amber-600" />
                            )}
                            <p>{SITE_STATUS_META[currentStatus].label}</p>
                        </div>
                    </div>

                    {/* Status Options */}
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">Select New Status</p>
                        {statusOptions.map(option => {
                            const Icon = option.icon;
                            const isSelected = selectedStatus === option.value;
                            const isCurrentStatus = currentStatus === option.value;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => setSelectedStatus(option.value)}
                                    disabled={isCurrentStatus}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                        isCurrentStatus
                                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon
                                            className={`size-5 shrink-0 mt-0.5 ${
                                                option.color === 'green'
                                                    ? 'text-green-600'
                                                    : option.color === 'amber'
                                                      ? 'text-amber-600'
                                                      : 'text-gray-600'
                                            }`}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium">{option.label}</p>
                                                {isCurrentStatus && (
                                                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Impact Message */}
                    {impact && (
                        <div
                            className={`rounded-lg p-4 border-2 ${
                                impact.type === 'error'
                                    ? 'bg-red-50 border-red-200'
                                    : impact.type === 'warning'
                                      ? 'bg-amber-50 border-amber-200'
                                      : 'bg-green-50 border-green-200'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <AlertTriangle
                                    className={`size-5 shrink-0 mt-0.5 ${
                                        impact.type === 'error'
                                            ? 'text-red-600'
                                            : impact.type === 'warning'
                                              ? 'text-amber-600'
                                              : 'text-green-600'
                                    }`}
                                />
                                <div>
                                    <p
                                        className={`font-medium mb-1 ${
                                            impact.type === 'error'
                                                ? 'text-red-900'
                                                : impact.type === 'warning'
                                                  ? 'text-amber-900'
                                                  : 'text-green-900'
                                        }`}
                                    >
                                        {impact.title}
                                    </p>
                                    <p
                                        className={`text-sm ${
                                            impact.type === 'error'
                                                ? 'text-red-800'
                                                : impact.type === 'warning'
                                                  ? 'text-amber-800'
                                                  : 'text-green-800'
                                        }`}
                                    >
                                        {impact.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Restriction Reason - Only shown for Temporarily Restricted */}
                    {selectedStatus === 'TEMPORARY_RESTRICTED' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-900">
                                Reason for Restriction <span className="text-red-600">*</span>
                            </label>
                            <textarea
                                value={restrictionReason}
                                onChange={e => setRestrictionReason(e.target.value)}
                                placeholder="Please describe the issue (e.g., fallen tree, flooding, maintenance work, livestock in area, etc.)"
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            />
                            <p className="text-sm text-gray-600">
                                This information will be shared with affected operators to help them
                                understand why the site is temporarily unavailable.
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={
                            currentStatus === 'UNDER_REVIEW' ||
                            selectedStatus === currentStatus ||
                            (selectedStatus === 'TEMPORARY_RESTRICTED' && !restrictionReason.trim())
                        }
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {currentStatus === 'UNDER_REVIEW'
                            ? 'Awaiting Verification'
                            : 'Update Status'}
                    </button>
                </div>
            </div>
        </div>
    );
}
