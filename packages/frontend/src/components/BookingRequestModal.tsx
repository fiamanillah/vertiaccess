import type { BookingRequest } from '../types';
import {
    X,
    MapPin,
    Calendar,
    FileText,
    User,
    Plane,
    Shield,
    Clock,
    AlertCircle,
    ShieldCheck,
    Download,
    Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Spinner } from './ui/spinner';

interface BookingRequestModalProps {
    request: BookingRequest;
    onApprove: () => void;
    onReject: () => void;
    isSubmitting?: boolean;
    submittingAction?: 'APPROVE' | 'REJECT' | null;
    onClose: () => void;
}

export function BookingRequestModal({
    request,
    onApprove,
    onReject,
    isSubmitting = false,
    submittingAction = null,
    onClose,
}: BookingRequestModalProps) {
    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20"
            >
                {/* Header */}
                <div className="p-8 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-4">
                        <div
                            className={`size-12 rounded-2xl flex items-center justify-center ${request.useCategory === 'planned_toal' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}
                        >
                            {request.useCategory === 'planned_toal' ? (
                                <Plane className="size-6" />
                            ) : (
                                <Shield className="size-6" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Booking Request Details
                            </h2>
                            <p className="text-sm text-slate-500">
                                Reference:{' '}
                                {request.humanId ||
                                    (request.id.length > 20
                                        ? `VA-BKG-${request.id.slice(0, 8).toUpperCase()}`
                                        : request.id)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-10 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-[#F3F4F6] rounded-full transition-all"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto">
                    {/* Mission Intent - Primary Section */}
                    <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                        <h3 className="text-sm font-bold text-[#1E40AF] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Info className="size-4" />
                            Mission Intent
                        </h3>
                        <p className="text-base text-[#1E3A8A] leading-relaxed font-medium italic">
                            "{request.missionIntent || 'No mission intent provided.'}"
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Operator Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <User className="size-4" />
                                Operator
                            </h3>
                            <div className="space-y-3">
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                            Operator ID
                                        </p>
                                        <p className="text-sm font-bold text-slate-900">
                                            OP_{request.operatorId.slice(0, 8).toUpperCase()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                            Full Name
                                        </p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {request.operatorName || 'Unknown Operator'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                                Contact Email
                                            </p>
                                            <p className="text-sm text-blue-600 font-medium break-all">
                                                {request.operatorEmail || 'Not provided'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                                Contact Phone
                                            </p>
                                            <p className="text-sm text-slate-900 font-medium">
                                                {request.operatorPhone || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            Flyer ID:
                                        </span>
                                        <span className="text-xs font-mono font-bold text-slate-600">
                                            {request.flyerId || 'Not provided'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Drone Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Plane className="size-4" />
                                Asset Information
                            </h3>
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                                <p className="text-sm font-semibold text-slate-900">
                                    {request.droneModel || 'Unspecified Aircraft'}
                                </p>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">
                                            Operation Type:
                                        </span>
                                        <span className="text-xs font-bold bg-[#EFF6FF] text-[#1E40AF] px-2 py-0.5 rounded-full uppercase">
                                            {request.useCategory === 'planned_toal'
                                                ? 'Planned TOAL'
                                                : 'Emergency & Recovery Site'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Landing Fee:</span>
                                        <span className="text-sm font-bold text-slate-900">
                                            £{request.toalCost?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Site & Window */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <MapPin className="size-4" />
                                Location
                            </h3>
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                                <p className="text-sm font-semibold text-slate-900 mb-1">
                                    {request.siteName}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Consented infrastructure access request.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="size-4" />
                                Schedule
                            </h3>
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                            <Clock className="size-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                {new Date(request.startTime).toLocaleDateString(
                                                    'en-GB',
                                                    {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    }
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(request.startTime).toLocaleTimeString(
                                                    [],
                                                    { hour: '2-digit', minute: '2-digit' }
                                                )}{' '}
                                                -{' '}
                                                {new Date(request.endTime).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operator Evidence & Documents */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck className="size-4" />
                            Operator Evidence & Documents
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {request.providedDocuments && request.providedDocuments.length > 0 ? (
                                request.providedDocuments.map((doc, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-600/30 hover:shadow-sm transition-all group cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="size-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                                <FileText className="size-5 text-slate-500 group-hover:text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate mb-0.5">
                                                    {doc.name}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="uppercase font-bold text-blue-600/70">
                                                        {doc.type}
                                                    </span>
                                                    <span className="size-1 rounded-full bg-gray-300" />
                                                    <span>{doc.fileSize}</span>
                                                </div>
                                            </div>
                                            <Download className="size-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="sm:col-span-2 p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center">
                                    <AlertCircle className="size-8 text-slate-400 mb-2" />
                                    <p className="text-sm font-medium text-slate-500">
                                        No evidence documents provided by operator.
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Landowner policy may require insurance and safety cases.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warning / Notes */}
                    <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                        <AlertCircle className="size-5 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <strong>Landowner Assurance:</strong> Approving this request provides
                            formal landowner consent for the specified window. Ensure your site is
                            clear of obstructions and personnel during these times.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-8 border-t border-slate-200 flex gap-4 justify-end bg-gray-50/50 shrink-0">
                    {request.status === 'PENDING' ? (
                        <>
                            <button
                                onClick={onReject}
                                disabled={isSubmitting}
                                className="h-12 px-8 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
                            >
                                {isSubmitting && submittingAction === 'REJECT' && (
                                    <Spinner
                                        size="sm"
                                        className="size-4 text-red-500"
                                        aria-label="Rejecting request"
                                    />
                                )}
                                {isSubmitting && submittingAction === 'REJECT'
                                    ? 'Rejecting...'
                                    : 'Reject Request'}
                            </button>
                            <button
                                onClick={onApprove}
                                disabled={isSubmitting}
                                className="h-12 px-8 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
                            >
                                {isSubmitting && submittingAction === 'APPROVE' && (
                                    <Spinner
                                        size="sm"
                                        className="size-4 text-white"
                                        aria-label="Approving request"
                                    />
                                )}
                                {isSubmitting && submittingAction === 'APPROVE'
                                    ? 'Approving...'
                                    : 'Approve Request'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="h-12 px-8 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold hover:bg-gray-50 transition-all"
                        >
                            Close Details
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
