import { ShieldCheck, ShieldAlert, CheckCircle, ChevronRight } from 'lucide-react';

interface VerificationStatusBannerProps {
    isVerified: boolean;
    isVerificationUnderReview: boolean;
    requiresVerificationSubmission: boolean;
    flyerId: string;
    rejectionNote: string | null;
    onOpenProfile: () => void;
}

export function VerificationStatusBanner({
    isVerified,
    isVerificationUnderReview,
    requiresVerificationSubmission,
    flyerId,
    rejectionNote,
    onOpenProfile,
}: VerificationStatusBannerProps) {
    if (isVerificationUnderReview) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                <div className="size-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-6 text-amber-600" />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-amber-900">Flyer ID Under Review</p>
                    <p className="text-sm text-amber-700 mt-1">
                        Your Flyer ID and operator documents are currently in review. You can browse
                        sites and prepare intents, but confirmed operations require verification
                        approval.
                    </p>
                </div>
                <button
                    onClick={onOpenProfile}
                    className="text-amber-800 text-sm font-semibold hover:underline flex items-center gap-1 shrink-0"
                >
                    View submission <ChevronRight className="size-4" />
                </button>
            </div>
        );
    }

    if (requiresVerificationSubmission) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                <div className="size-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <ShieldAlert className="size-6 text-red-600" />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-red-900">Document Verification Required</p>
                    <p className="text-sm text-red-700 mt-1">
                        Upload your Flyer ID and supporting operator documents to unlock booking
                        confirmations.
                    </p>
                    {rejectionNote && (
                        <div className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2">
                            <p className="text-[11px] font-black uppercase tracking-wider text-red-700">
                                Admin note
                            </p>
                            <p className="mt-1 text-sm text-red-800 whitespace-pre-wrap">
                                {rejectionNote}
                            </p>
                        </div>
                    )}
                </div>
                <button
                    onClick={onOpenProfile}
                    className="text-red-800 text-sm font-semibold hover:underline flex items-center gap-1 shrink-0"
                >
                    Complete verification <ChevronRight className="size-4" />
                </button>
            </div>
        );
    }

    if (isVerified) {
        return (
            <div className="bg-[#EAF2FF] border border-[#D6E4FF] rounded-xl p-5 flex items-start gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                <div className="size-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-[#D6E4FF]">
                    <CheckCircle className="size-6 text-blue-600" />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-slate-900">Operator Verified</p>
                    <p className="text-sm text-slate-600 mt-1">
                        Your Flyer ID (<strong>{flyerId || 'GBR-RPAS-20241'}</strong>) is verified
                        for UK operations.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}
