import React from 'react';
import type { BookingRequest, Site, ManagedUser } from '../types';
import {
    X,
    MapPin,
    User,
    Shield,
    Clock,
    Info,
    CheckCircle,
    AlertCircle,
    Calendar,
    ArrowRight,
    ShieldCheck,
    FileText,
    Building2,
    Mail,
    Phone,
    History,
    UserCheck,
    CreditCard,
    Plane,
} from 'lucide-react';
import { motion } from 'motion/react';

interface BookingDetailModalProps {
    booking: BookingRequest;
    onClose: () => void;
    site?: Site;
    landowner?: ManagedUser;
    operator?: ManagedUser;
}

export function BookingDetailModal({
    booking,
    onClose,
    site,
    landowner,
    operator,
}: BookingDetailModalProps) {
    // Mock status history/audit trail since it's not in the base type yet
    const auditTrail = [
        {
            status: 'requested',
            label: 'Booking Request Submitted',
            timestamp: booking.createdAt,
            user: booking.operatorOrganisation || 'Operator',
        },
        ...(booking.respondedAt
            ? [
                  {
                      status: booking.status,
                      label: `Booking ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`,
                      timestamp: booking.respondedAt,
                      user: 'System / Landowner',
                  },
              ]
            : []),
        ...(booking.cancelledAt
            ? [
                  {
                      status: 'cancelled',
                      label: 'Booking Cancelled',
                      timestamp: booking.cancelledAt || new Date().toISOString(),
                      user: 'Operator',
                  },
              ]
            : []),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            requested: 'bg-amber-50 text-amber-700 border-amber-100',
            rejected: 'bg-red-50 text-red-700 border-red-100',
            cancelled: 'bg-slate-50 text-slate-700 border-slate-100',
            expired: 'bg-slate-50 text-slate-500 border-slate-100',
            blocked_site_issue: 'bg-red-100 text-red-800 border-red-200',
        };
        return (
            <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${styles[status] || styles.requested}`}
            >
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[300]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100"
            >
                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="size-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Calendar className="size-7 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                    {booking.operationReference}
                                </h2>
                                <StatusBadge status={booking.status} />
                            </div>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                {booking.siteName} •{' '}
                                {new Date(booking.startTime).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-12 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                    >
                        <X className="size-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 bg-slate-50 custom-scrollbar space-y-8">
                    {/* Main Grid */}
                    <div className="grid md:grid-cols-4 gap-8">
                        {/* Operator Information */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6 md:col-span-3">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <ShieldCheck className="size-5 text-blue-600" />
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
                                    Operator Profile
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                        Full Name
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-base font-bold text-slate-800">
                                            {booking.operatorOrganisation || 'Independent Operator'}
                                        </p>
                                        <span className="text-[10px] font-mono font-bold text-slate-400">
                                            REF: {booking.operatorId || 'OP-7B2X'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                        Contact Email
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Mail className="size-3.5 text-slate-400" />
                                        <p className="text-sm font-bold text-slate-800">
                                            {booking.operatorEmail}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                        Flyer ID (CAA Verified)
                                    </p>
                                    <p className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                                        {booking.flyerId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                        Aircraft Model
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Plane className="size-3.5 text-slate-400" />
                                        <p className="text-sm font-bold text-slate-800">
                                            {booking.droneModel}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                        Mission Intent
                                    </p>
                                    <p className="text-sm text-slate-500 leading-relaxed italic">
                                        "{booking.missionIntent}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Site & Landowner Info */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6 md:col-span-1">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <MapPin className="size-5 text-blue-600" />
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
                                    Site Information
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                        Site Location
                                    </p>
                                    <p className="text-base font-bold text-slate-800">
                                        {booking.siteName}
                                    </p>
                                    {site && (
                                        <p className="text-sm text-slate-500">{site.address}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                        Landowner / Authority
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="size-3.5 text-slate-400" />
                                        <p className="text-sm font-bold text-slate-800">
                                            {landowner?.name ||
                                                site?.landownerName ||
                                                'Managed Authority'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                        Infrastructure Type
                                    </p>
                                    <p className="text-sm font-bold text-slate-800 capitalize">
                                        {(site?.siteCategory || 'Private Land').replace('_', ' ')}
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <span
                                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                            booking.useCategory === 'emergency_recovery'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}
                                    >
                                        {booking.useCategory === 'emergency_recovery'
                                            ? 'Contingency Use (Emergency and Recovery Site)'
                                            : 'Standard Use (TOAL)'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Time Window & Financials */}
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-4 col-span-2">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <Clock className="size-5 text-blue-600" />
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
                                    Operational Window
                                </h3>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                        Start Time (UTC)
                                    </p>
                                    <p className="text-base font-bold text-slate-800">
                                        {new Date(booking.startTime).toLocaleDateString('en-GB')} •{' '}
                                        {new Date(booking.startTime).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-slate-100" />
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                        End Time (UTC)
                                    </p>
                                    <p className="text-base font-bold text-slate-800">
                                        {new Date(booking.endTime).toLocaleDateString('en-GB')} •{' '}
                                        {new Date(booking.endTime).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <CreditCard className="size-5 text-blue-600" />
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
                                    Financials
                                </h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500 font-medium">
                                        Access Fee
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                        £{booking.toalCost?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500 font-medium">
                                        Platform Fee
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                        £{booking.platformFee?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                                    <span className="text-sm font-black uppercase text-slate-800">
                                        Total
                                    </span>
                                    <span className="text-lg font-black text-blue-600">
                                        £
                                        {(
                                            (booking.toalCost || 0) + (booking.platformFee || 0)
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Audit Trail */}
                    <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                            <History className="size-5 text-blue-600" />
                            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
                                Status History & Audit Trail
                            </h3>
                        </div>
                        <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                            {auditTrail.map((entry, idx) => (
                                <div key={idx} className="flex gap-6 relative">
                                    <div
                                        className={`size-[24px] rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10 ${
                                            entry.status === 'approved'
                                                ? 'bg-emerald-500'
                                                : entry.status === 'requested'
                                                  ? 'bg-amber-500'
                                                  : 'bg-red-500'
                                        }`}
                                    />
                                    <div className="flex-1 pb-6 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-800">
                                                {entry.label}
                                            </p>
                                            <p className="text-xs text-slate-400 font-medium">
                                                {new Date(entry.timestamp).toLocaleDateString()} •{' '}
                                                {new Date(entry.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">
                                            Action by: {entry.user}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-6 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Info className="size-4 text-slate-400" />
                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
                            Aviation-grade audit trail • {booking.operationReference}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-12 px-8 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                    >
                        Close Detail
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
