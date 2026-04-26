import type { Site } from '../../types';
import { SectionTitle } from './SectionTitle';

interface AdminReviewSectionProps {
    site: Site;
    isAdminMode: boolean;
    currentStatus: string;
    verificationStatus?: string;
    stats: {
        totalDocuments: number;
        policyDocuments: number;
        ownershipDocuments: number;
    };
    landownerInfo?: {
        name?: string;
        email?: string;
        organisation?: string;
    };
    internalNote: string;
    setInternalNote: (val: string) => void;
    hasInternalNoteChanged: boolean;
    handleSaveInternalNote: () => void;
    onSaveAdminInternalNote?: (value: string) => Promise<void> | void;
    isSavingInternalNote: boolean;
    adminInternalNoteSaving?: boolean;
    rejectionNote: string;
    consentChecks?: {
        authorizedToGrantAccess?: boolean;
        acceptedLandownerDeclaration?: boolean;
    };
}

export function AdminReviewSection({
    site,
    isAdminMode,
    currentStatus,
    verificationStatus,
    stats,
    landownerInfo,
    internalNote,
    setInternalNote,
    hasInternalNoteChanged,
    handleSaveInternalNote,
    onSaveAdminInternalNote,
    isSavingInternalNote,
    adminInternalNoteSaving,
    rejectionNote,
    consentChecks,
}: AdminReviewSectionProps) {
    return (
        <>
            {!isAdminMode && currentStatus === 'REJECTED' && site.rejectionReasonNote && (
                <div className="bg-red-50 rounded-2xl p-5 border border-red-200 shadow-sm mt-6">
                    <SectionTitle>Rejection Reason</SectionTitle>
                    <p className="text-sm text-red-800 leading-relaxed">
                        {site.rejectionReasonNote}
                    </p>
                </div>
            )}

            {isAdminMode && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mt-6">
                    <SectionTitle>Admin Review Summary</SectionTitle>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Status
                                </p>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {verificationStatus || 'PENDING'}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Total Docs
                                </p>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {stats.totalDocuments}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Policy Docs
                                </p>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {stats.policyDocuments}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Ownership Docs
                                </p>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {stats.ownershipDocuments}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Submitted By
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                                {landownerInfo?.name || site.landownerName || 'Unknown'}
                            </p>
                            <p className="text-xs text-slate-500">
                                {landownerInfo?.email || 'Email unavailable'}
                            </p>
                            <p className="text-xs text-slate-500">
                                {landownerInfo?.organisation || 'Independent'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Admin Review Note (Internal Only)
                            </label>
                            <textarea
                                rows={3}
                                value={internalNote}
                                onChange={e => setInternalNote(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                placeholder="Internal note for admins only. Not visible to landowner."
                            />
                            {hasInternalNoteChanged && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => void handleSaveInternalNote()}
                                        disabled={
                                            !onSaveAdminInternalNote ||
                                            isSavingInternalNote ||
                                            adminInternalNoteSaving
                                        }
                                        className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isSavingInternalNote || adminInternalNoteSaving
                                            ? 'Saving...'
                                            : 'Save Note'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {verificationStatus === 'REJECTED' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-red-700 uppercase tracking-wider">
                                    Rejection Reason (Shown To Landowner)
                                </label>
                                <div className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800 font-medium">
                                    {rejectionNote || 'No rejection reason provided.'}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Consent: Authorised To Grant Access
                                </p>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {consentChecks?.authorizedToGrantAccess
                                        ? 'Checked'
                                        : 'Not Checked'}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Consent: Landowner Declaration
                                </p>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {consentChecks?.acceptedLandownerDeclaration
                                        ? 'Checked'
                                        : 'Not Checked'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
