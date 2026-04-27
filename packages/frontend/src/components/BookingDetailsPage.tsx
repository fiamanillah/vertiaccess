import { useParams, useNavigate } from 'react-router-dom';
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
    ChevronLeft,
} from 'lucide-react';
import { Header } from './Header';
import type { User } from '../App';

interface BookingDetailsPageProps {
    user: User;
    bookings: BookingRequest[];
    onLogout: () => void;
    onCancelBooking: (booking: BookingRequest) => void;
    onEditBooking?: (booking: BookingRequest) => void;
    onPayBooking?: (booking: BookingRequest) => void;
    isPayingBooking?: boolean;
}

export function BookingDetailsPage({
    user,
    bookings,
    onLogout,
    onCancelBooking,
    onEditBooking,
    onPayBooking,
    isPayingBooking = false,
}: BookingDetailsPageProps) {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();

    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header
                    user={user}
                    onLogout={onLogout}
                    onOpenProfile={() => navigate('/dashboard/operator?profile=true')}
                    notificationCount={0}
                    notifications={[]}
                    onMarkAsRead={() => {}}
                    onMarkAllAsRead={() => {}}
                    onPrevPage={() => {}}
                    onNextPage={() => {}}
                    notificationsLoading={false}
                />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-slate-800">Booking Not Found</h2>
                        <button
                            onClick={() => navigate('/dashboard/operator')}
                            className="mt-4 text-blue-600 font-bold hover:underline"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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

    const calculateCancellationFee = () => {
        if (isAfterOperationTime) return total;
        const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilStart > 24) return 0;
        if (hoursUntilStart >= 2) return total * 0.5;
        return total;
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
        <div className="min-h-screen bg-slate-50">
            <Header
                user={user}
                onLogout={onLogout}
                onOpenProfile={() => navigate('/dashboard/operator?profile=true')}
                notificationCount={0}
                notifications={[]}
                onMarkAsRead={() => {}}
                onMarkAllAsRead={() => {}}
                onPrevPage={() => {}}
                onNextPage={() => {}}
                notificationsLoading={false}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-white rounded-4xl shadow-xl overflow-hidden border border-slate-200">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard/operator')}
                                className="size-10 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all"
                            >
                                <ChevronLeft className="size-6" />
                            </button>
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
                    </div>

                    <div className="p-8 space-y-10">
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
                            {booking.status === 'APPROVED' &&
                                booking.paymentStatus !== 'pending' && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                        <CheckCircle className="size-4" />
                                        <span className="text-xs font-black uppercase">
                                            Landowner Consent Verified
                                        </span>
                                    </div>
                                )}
                        </div>

                        {/* Warning if operation time has passed */}
                        {isAfterOperationTime && canCancel && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
                                <AlertTriangle className="size-6 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-red-900">
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

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-8">
                                {/* Site Information */}
                                <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6">
                                    <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                        <MapPin className="size-5 text-blue-600" />
                                        Site Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                Site Name
                                            </p>
                                            <p className="font-bold text-slate-800">
                                                {booking.siteName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                Site Status
                                            </p>
                                            <span
                                                className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                                    booking.siteStatus === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                                                }`}
                                            >
                                                {booking.siteStatus || 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Operation Details */}
                                <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6">
                                    <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                        <Calendar className="size-5 text-blue-600" />
                                        Operation Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                    Reference
                                                </p>
                                                <p className="font-mono text-sm text-slate-800">
                                                    {booking.operationReference}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                    Type
                                                </p>
                                                <p className="text-sm font-bold text-slate-800 capitalize">
                                                    {(booking as any).siteType || 'TOAL'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                    Start
                                                </p>
                                                <p className="text-sm text-slate-800 font-medium">
                                                    {startTime.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                    End
                                                </p>
                                                <p className="text-sm text-slate-800 font-medium">
                                                    {endTime.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                Mission Intent
                                            </p>
                                            <p className="text-sm font-medium italic text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                                                "{booking.missionIntent}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Aircraft & Operator */}
                                <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6">
                                    <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                        <Plane className="size-5 text-blue-600" />
                                        Aircraft & Operator
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                    Drone
                                                </p>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {booking.droneModel}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                    Flyer ID
                                                </p>
                                                <p className="text-sm font-mono text-slate-600">
                                                    {booking.flyerId || 'GBR-RPAS-20241'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                Operator
                                            </p>
                                            <p className="text-sm font-bold text-slate-800">
                                                {booking.operatorName || 'Akshav Bhundoo'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="bg-blue-50/50 rounded-3xl border border-blue-100 p-6">
                                    <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                        <CreditCard className="size-5 text-blue-600" />
                                        Pricing
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600">Access Fee</span>
                                            <span className="font-bold">
                                                £{(booking.toalCost || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600">Platform Fee</span>
                                            <span className="font-bold">
                                                £{(booking.platformFee || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="border-t border-blue-200 pt-3 mt-3 flex justify-between items-center">
                                            <span className="font-black text-slate-800 uppercase text-xs tracking-widest">
                                                Total Paid
                                            </span>
                                            <span className="font-black text-blue-600 text-xl">
                                                £{total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Audit Log */}
                        <div className="rounded-3xl border border-slate-200 p-8 shadow-inner bg-slate-50/30">
                            <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3">
                                <Clock className="size-5 text-blue-600" />
                                Digital Audit Log
                            </h3>
                            <div className="relative pl-8 border-l-2 border-slate-200 ml-5 space-y-8">
                                {paymentAuditEvents.map((event, idx) => (
                                    <div key={idx} className="relative">
                                        <div
                                            className={`absolute -left-11.25 top-0 size-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${event.dotClassName.replace('bg-', 'bg-opacity-20 ')}`}
                                        >
                                            <div
                                                className={`size-3 rounded-full ${event.dotClassName}`}
                                            />
                                        </div>
                                        <p className="text-sm font-black text-slate-800">
                                            {event.title}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </p>
                                        <p className="mt-2 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 inline-block shadow-sm">
                                            {event.detail}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100">
                            <button
                                onClick={() => navigate('/dashboard/operator')}
                                className="flex-1 h-14 bg-white border border-slate-200 text-slate-800 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm"
                            >
                                Back to Dashboard
                            </button>

                            {canCancel && (
                                <button
                                    onClick={() => onCancelBooking(booking)}
                                    className="flex-1 h-14 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-black hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <XCircle className="size-5" />
                                    Cancel Booking
                                </button>
                            )}

                            {booking.status === 'APPROVED' &&
                                booking.paymentStatus === 'pending' &&
                                onPayBooking && (
                                    <button
                                        onClick={() => onPayBooking(booking)}
                                        disabled={isPayingBooking}
                                        className="flex-1 h-14 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/10"
                                    >
                                        <CreditCard className="size-5" />
                                        Pay £{total.toFixed(2)} Now
                                    </button>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
