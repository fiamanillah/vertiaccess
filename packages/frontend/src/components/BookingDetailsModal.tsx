import type { BookingRequest } from '../types';
import {
    X,
    MapPin,
    Calendar,
    FileText,
    Plane,
    AlertTriangle,
    Edit2,
    XCircle,
    CheckCircle,
    Clock,
    ShieldCheck,
    Download,
    CreditCard,
} from 'lucide-react';

interface BookingDetailsModalProps {
    booking: BookingRequest;
    onClose: () => void;
    onCancelBooking: (booking: BookingRequest) => void;
    onEditBooking?: (booking: BookingRequest) => void;
    onPayBooking?: (booking: BookingRequest) => void;
    isPayingBooking?: boolean;
}

export function BookingDetailsModal({
    booking,
    onClose,
    onCancelBooking,
    onEditBooking,
    onPayBooking,
    isPayingBooking = false,
}: BookingDetailsModalProps) {
    type PaymentAuditEvent = {
        title: string;
        timestamp: string;
        detail: string;
        dotClassName: string;
    };

    const total = (booking.toalCost || 0) + (booking.platformFee || 0);
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const now = new Date();
    const isPastOperation = endTime < now;
    const isAfterOperationTime = startTime < now;
    const canCancel = booking.status === 'APPROVED' || booking.status === 'PENDING';
    const canEdit = booking.status === 'PENDING' && !isAfterOperationTime;
    const normalizedStatus = String(booking.status);

    // Calculate cancellation fee
    const calculateCancellationFee = () => {
        if (isAfterOperationTime) {
            return total; // Full amount charged if cancelled after operation start time
        }

        const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilStart > 24) {
            return 0;
        } else if (hoursUntilStart >= 2) {
            return total * 0.5; // 50% fee
        } else {
            return total; // Full fee
        }
    };

    const cancellationFee = calculateCancellationFee();

    const paymentMethodSummary =
        booking.paymentMethodBrand && booking.paymentMethodLast4
            ? `${booking.paymentMethodBrand.toUpperCase()} •••• ${booking.paymentMethodLast4}`
            : 'Card on file';

    const paymentAuditEvents: PaymentAuditEvent[] = [];

    if (booking.isPAYG) {
        paymentAuditEvents.push({
            title: 'Payment Authorization Requested',
            timestamp: booking.createdAt,
            detail: `Estimated amount £${total.toFixed(2)} (${paymentMethodSummary}).`,
            dotClassName: 'bg-amber-500',
        });
    }

    if (booking.paymentStatus === 'charged') {
        paymentAuditEvents.push({
            title: 'Payment Captured',
            timestamp: booking.respondedAt || booking.createdAt,
            detail: `Paid £${total.toFixed(2)} via ${paymentMethodSummary}.`,
            dotClassName: 'bg-emerald-600',
        });
    } else if (booking.paymentStatus === 'pending') {
        paymentAuditEvents.push({
            title: 'Payment Pending',
            timestamp: booking.createdAt,
            detail: `Awaiting capture for £${total.toFixed(2)}.`,
            dotClassName: 'bg-amber-500',
        });
    } else if (booking.paymentStatus === 'refunded') {
        paymentAuditEvents.push({
            title: 'Payment Refunded',
            timestamp: booking.cancelledAt || booking.respondedAt || booking.createdAt,
            detail: `Refund processed for £${total.toFixed(2)}.`,
            dotClassName: 'bg-violet-600',
        });
    } else if (booking.paymentStatus === 'cancelled_partial') {
        paymentAuditEvents.push({
            title: 'Partial Charge Applied',
            timestamp: booking.cancelledAt || booking.createdAt,
            detail: `Cancellation fee retained: £${(booking.cancellationFee || 0).toFixed(2)}.`,
            dotClassName: 'bg-orange-600',
        });
    } else if (booking.paymentStatus === 'cancelled_no_charge') {
        paymentAuditEvents.push({
            title: 'No Charge on Cancellation',
            timestamp: booking.cancelledAt || booking.createdAt,
            detail: 'Booking was cancelled without payment capture.',
            dotClassName: 'bg-slate-500',
        });
    } else if (booking.paymentStatus === 'cancelled_full') {
        paymentAuditEvents.push({
            title: 'Full Charge Applied on Cancellation',
            timestamp: booking.cancelledAt || booking.createdAt,
            detail: `Full cancellation charge retained: £${total.toFixed(2)}.`,
            dotClassName: 'bg-rose-600',
        });
    }

    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col isolation-isolate">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-4">
                        <div className="size-11 bg-[#EAF2FF] rounded-xl flex items-center justify-center text-blue-600">
                            <FileText className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                Booking Audit Details
                            </h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                Reference: {booking.operationReference}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-10 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* Booking Status Banner */}
                    <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Operational Status
                            </p>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`size-2 rounded-full animate-pulse ${
                                        booking.status === 'APPROVED'
                                            ? 'bg-[#15803D]'
                                            : booking.status === 'PENDING'
                                              ? 'bg-amber-500'
                                              : 'bg-slate-400'
                                    }`}
                                />
                                <span
                                    className={`text-base font-black uppercase tracking-tight ${
                                        booking.status === 'APPROVED'
                                            ? 'text-[#15803D]'
                                            : booking.status === 'PENDING'
                                              ? 'text-amber-700'
                                              : 'text-slate-600'
                                    }`}
                                >
                                    {normalizedStatus === 'BLOCKED_SITE_ISSUE'
                                        ? 'Site Restriction Blocked'
                                        : booking.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>
                        {booking.status === 'APPROVED' && booking.paymentStatus !== 'pending' && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                <CheckCircle className="size-4" />
                                <span className="text-xs font-black uppercase">
                                    Landowner Consent Verified
                                </span>
                            </div>
                        )}
                        {booking.status === 'APPROVED' && booking.paymentStatus === 'pending' && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                                <AlertTriangle className="size-4" />
                                <span className="text-xs font-black uppercase">
                                    Payment Required
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Warning if operation time has passed */}
                    {isAfterOperationTime && canCancel && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-900">
                                    Operation Time Has Passed
                                </p>
                                <p className="text-sm text-red-800 mt-1">
                                    Cancelling this booking will result in{' '}
                                    <strong>full charge (£{total.toFixed(2)})</strong> as the
                                    scheduled operation time has already begun or passed.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Site Information */}
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                            <MapPin className="size-5 text-indigo-600" />
                            Site Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Site Name</p>
                                <p className="font-medium">{booking.siteName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Site Status</p>
                                <span
                                    className={`inline-flex px-3 py-1 rounded-full text-sm ${
                                        booking.siteStatus === 'ACTIVE'
                                            ? 'bg-green-100 text-green-800'
                                            : booking.siteStatus === 'DISABLE'
                                              ? 'bg-gray-100 text-gray-800'
                                              : booking.siteStatus === 'TEMPORARY_RESTRICTED'
                                                ? 'bg-red-100 text-red-800'
                                                : booking.siteStatus === 'WITHDRAWN'
                                                  ? 'bg-red-100 text-red-800'
                                                  : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    {booking.siteStatus === 'ACTIVE'
                                        ? 'Active'
                                        : booking.siteStatus === 'DISABLE'
                                          ? 'Disabled'
                                          : booking.siteStatus === 'TEMPORARY_RESTRICTED'
                                            ? 'Temporarily Restricted'
                                            : booking.siteStatus === 'WITHDRAWN'
                                              ? 'Withdrawn'
                                              : booking.siteStatus || 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Operation Details */}
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                            <Calendar className="size-5 text-indigo-600" />
                            Operation Details
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">
                                        Operation Reference
                                    </p>
                                    <p className="font-mono text-sm">
                                        {booking.operationReference}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Site Type</p>
                                    <p className="text-sm capitalize">
                                        {(booking as any).siteType || 'TOAL'}
                                    </p>
                                </div>
                            </div>
                            {booking.isPAYG && (
                                <div className="bg-blue-50 border border-blue-100 rounded p-2 mb-2">
                                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                                        PAYG Mode
                                    </p>
                                    <p className="text-sm text-blue-900 font-medium">
                                        Type:{' '}
                                        {booking.operationType === 'bvlos'
                                            ? 'BVLOS / Regulatory'
                                            : 'Standard'}
                                    </p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Start Time</p>
                                    <p className="text-sm">{startTime.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">End Time</p>
                                    <p className="text-sm">{endTime.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Duration</p>
                                    <p className="text-sm">
                                        {Math.round(
                                            (endTime.getTime() - startTime.getTime()) /
                                                (1000 * 60 * 60)
                                        )}{' '}
                                        hours
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Mission Intent</p>
                                    <p className="text-sm font-medium italic text-slate-600">
                                        "{booking.missionIntent}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Aircraft & Operator Information */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="size-10 bg-[#EAF2FF] rounded-xl flex items-center justify-center text-blue-600">
                                <Plane className="size-5" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                Aircraft & Operator Information
                            </h3>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Drone Model
                                    </p>
                                    <p className="text-base font-black text-slate-800">
                                        {booking.droneModel}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Operator Full Name
                                    </p>
                                    <p className="text-base font-black text-slate-800">
                                        {booking.operatorName || 'Akshav Bhundoo'}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Flyer ID
                                    </p>
                                    <p className="text-base font-bold text-slate-600 font-mono tracking-wider">
                                        {booking.flyerId || 'GBR-RPAS-20241'}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Operator ID
                                    </p>
                                    <p className="text-base font-bold text-slate-600 font-mono tracking-wider">
                                        {booking.operatorId || 'OP-7B2X9W1'}
                                    </p>
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Organisation
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-black text-slate-800">
                                            {booking.operatorOrganisation || 'Not specified'}
                                        </span>
                                        {booking.operatorOrganisation && (
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded">
                                                Verified Entity
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operator Evidence & Documents */}
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                            <ShieldCheck className="size-5 text-indigo-600" />
                            Operator Evidence & Documents
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {booking.providedDocuments && booking.providedDocuments.length > 0 ? (
                                booking.providedDocuments.map((doc, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-lg border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all group cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="size-9 rounded bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                                <FileText className="size-4 text-gray-500 group-hover:text-indigo-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {doc.name}
                                                </p>
                                                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                                                    {doc.type} • {doc.fileSize}
                                                </p>
                                            </div>
                                            <Download className="size-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="sm:col-span-2 p-4 rounded-lg border border-dashed border-gray-200 bg-white flex flex-col items-center justify-center text-center">
                                    <p className="text-sm text-gray-500">
                                        No additional evidence documents provided.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Premium Audit Log (Evidence) */}
                    <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="size-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                <Clock className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                    Audit Log (Digital Evidence)
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Immutable record of operational authority & consent
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="relative pl-8 border-l-2 border-slate-200 ml-5 space-y-8">
                                <div className="relative">
                                    <div className="absolute -left-11.25 top-0 size-8 rounded-full bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center z-10">
                                        <FileText className="size-3.5 text-slate-500" />
                                    </div>
                                    <p className="text-sm font-black text-slate-800">
                                        Booking Record Generated
                                    </p>
                                    <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                                        {new Date(booking.createdAt).toLocaleString()}
                                    </p>
                                    <div className="bg-white rounded-xl p-4 mt-3 border border-slate-100 shadow-sm space-y-1.5 hover:border-slate-300 transition-colors">
                                        <p className="text-xs text-slate-600 font-mono">
                                            <span className="text-slate-400 font-bold uppercase mr-2 tracking-widest text-[10px]">
                                                System ID:
                                            </span>{' '}
                                            {booking.id}
                                        </p>
                                        <p className="text-xs text-slate-600 font-mono">
                                            <span className="text-slate-400 font-bold uppercase mr-2 tracking-widest text-[10px]">
                                                Actor (Op):
                                            </span>{' '}
                                            {booking.operatorEmail}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                                            <ShieldCheck className="size-3 text-emerald-500" />
                                            <p className="text-[10px] uppercase font-bold text-slate-500">
                                                Standard digital consent cryptography applied
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {booking.respondedAt && (
                                    <div className="relative">
                                        <div className="absolute -left-11.25 top-0 size-8 rounded-full bg-emerald-50 border-2 border-emerald-200 shadow-sm flex items-center justify-center z-10">
                                            <CheckCircle className="size-3.5 text-emerald-600" />
                                        </div>
                                        <p className="text-sm font-black text-slate-800">
                                            Landowner Approval (Consent Granted)
                                        </p>
                                        <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                                            {new Date(booking.respondedAt).toLocaleString()}
                                        </p>
                                        <div className="bg-emerald-50/50 rounded-xl p-3 mt-3 border border-emerald-100/50">
                                            <p className="text-xs text-emerald-800 font-medium">
                                                Digital consent formally granted by verified
                                                landowner mapping identity.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="relative">
                                    <div className="absolute -left-11.25 top-0 size-8 rounded-full bg-blue-50 border-2 border-blue-200 shadow-sm flex items-center justify-center z-10">
                                        <ShieldCheck className="size-3.5 text-blue-600" />
                                    </div>
                                    <p className="text-sm font-black text-slate-800">
                                        Time-bound Access Window Locked
                                    </p>
                                    <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                                        {startTime.toLocaleDateString()}
                                    </p>
                                    <div className="bg-blue-50/50 rounded-xl p-3 mt-3 border border-blue-100/50 flex gap-3">
                                        <div className="pt-0.5">
                                            <MapPin className="size-4 text-blue-500" />
                                        </div>
                                        <p className="text-xs text-blue-800 font-medium italic leading-relaxed">
                                            "Verified evidence of lawful site access operations
                                            strictly bound to {booking.siteName}"
                                        </p>
                                    </div>
                                </div>

                                {paymentAuditEvents.length > 0 && (
                                    <div className="relative">
                                        <div className="absolute -left-11.25 top-0 size-8 rounded-full bg-indigo-50 border-2 border-indigo-200 shadow-sm flex items-center justify-center z-10">
                                            <CreditCard className="size-3.5 text-indigo-600" />
                                        </div>
                                        <p className="text-sm font-black text-slate-800">
                                            Payment Ledger & Transactions
                                        </p>
                                        <div className="mt-4 space-y-3">
                                            {paymentAuditEvents.map((event, idx) => (
                                                <div
                                                    key={`${event.title}-${idx}`}
                                                    className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-start gap-4 transition-colors hover:border-indigo-200 group"
                                                >
                                                    <span
                                                        className={`shrink-0 mt-1 size-3 rounded-full ${event.dotClassName} ring-4 ring-slate-50 group-hover:scale-110 transition-transform`}
                                                    />
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                            {event.title}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                            {new Date(
                                                                event.timestamp
                                                            ).toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 inline-block">
                                                            {event.detail}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {booking.isPAYG && booking.operationType === 'standard' && (
                                <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-4 items-start shadow-inner">
                                    <div className="size-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                                        <FileText className="size-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-indigo-900 uppercase tracking-widest pt-0.5">
                                            Standard PAYG Note
                                        </p>
                                        <p className="text-xs font-medium text-indigo-800/80 leading-relaxed mt-1.5 pr-4">
                                            This immutable audit log serves as your verifiable
                                            evidence of landowner permission. Full exportable PDF
                                            consent certificates with cryptographic QR verification
                                            are exclusively available on{' '}
                                            <strong className="text-indigo-900 font-bold">
                                                BVLOS & Regulatory
                                            </strong>{' '}
                                            plans.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="bg-linear-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 p-4">
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                            <FileText className="size-5 text-indigo-600" />
                            Pricing Breakdown
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Site Access Fee</span>
                                <span className="text-sm font-medium">
                                    £{(booking.toalCost || 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Platform Fee</span>
                                <span className="text-sm font-medium">
                                    £{(booking.platformFee || 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="border-t border-indigo-200 pt-2 mt-2 flex justify-between items-center">
                                <span className="font-medium">Total Paid</span>
                                <span className="font-medium text-lg">£{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timestamps */}
                    {/* <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Clock className="size-5 text-indigo-600" />
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Booking Created</span>
                <span className="font-medium">
                  {new Date(booking.createdAt).toLocaleString()}
                </span>
              </div>
              {booking.respondedAt && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Landowner Responded</span>
                  <span className="font-medium">
                    {new Date(booking.respondedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {booking.cancelledAt && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Cancelled At</span>
                  <span className="font-medium">
                    {new Date(booking.cancelledAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div> */}

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-8 border-t border-slate-100">
                        <button
                            onClick={onClose}
                            className="flex-1 h-12 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                        >
                            Close Record
                        </button>

                        {booking.status === 'APPROVED' && booking.paymentStatus === 'pending' && onPayBooking && (
                            <button
                                onClick={() => onPayBooking(booking)}
                                disabled={isPayingBooking}
                                className="flex-1 h-12 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                            >
                                {isPayingBooking ? (
                                    <>
                                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="size-4" />
                                        Pay £{total.toFixed(2)} Now
                                    </>
                                )}
                            </button>
                        )}

                        {canEdit && onEditBooking && (
                            <button
                                onClick={() => onEditBooking(booking)}
                                className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/10"
                            >
                                <Edit2 className="size-4" />
                                Modify Intent
                            </button>
                        )}

                        {canCancel && (
                            <button
                                onClick={() => onCancelBooking(booking)}
                                className="flex-1 h-12 bg-white border-2 border-red-100 text-red-600 rounded-xl font-black hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <XCircle className="size-4" />
                                Cancel Booking
                            </button>
                        )}
                    </div>

                    {/* Cancellation Fee Preview */}
                    {canCancel && (
                        <div
                            className={`rounded-lg p-3 text-sm ${
                                isAfterOperationTime
                                    ? 'bg-red-50 border border-red-200 text-red-800'
                                    : cancellationFee === 0
                                      ? 'bg-green-50 border border-green-200 text-green-800'
                                      : cancellationFee === total
                                        ? 'bg-red-50 border border-red-200 text-red-800'
                                        : 'bg-amber-50 border border-amber-200 text-amber-800'
                            }`}
                        >
                            <p className="font-medium mb-1">
                                {isAfterOperationTime
                                    ? '⚠️ Full Charge Applies'
                                    : cancellationFee === 0
                                      ? '✓ Free Cancellation Available'
                                      : cancellationFee === total
                                        ? '⚠️ Full Charge Applies'
                                        : '⚠️ Partial Cancellation Fee Applies'}
                            </p>
                            <p className="text-xs">
                                {isAfterOperationTime
                                    ? `Cancelling after the operation start time will result in a full charge of £${total.toFixed(2)}.`
                                    : cancellationFee === 0
                                      ? 'You can cancel this booking at no charge (more than 24 hours notice).'
                                      : cancellationFee === total
                                        ? 'Cancelling within 2 hours of operation start will result in full charge.'
                                        : `Cancelling now will result in a £${cancellationFee.toFixed(2)} cancellation fee (50% of total).`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
