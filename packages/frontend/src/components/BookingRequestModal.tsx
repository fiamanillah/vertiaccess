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
    Building2,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Zap,
    ImageOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Spinner } from './ui/spinner';
import { useState } from 'react';
import { ReadOnlySiteMap } from './ReadOnlySiteMap';

interface BookingRequestModalProps {
    request: BookingRequest;
    onApprove: () => void;
    onReject: () => void;
    isSubmitting?: boolean;
    submittingAction?: 'APPROVE' | 'REJECT' | null;
    onClose: () => void;
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string; icon: any }> = {
        PENDING: {
            label: 'Pending Approval',
            cls: 'bg-amber-50 text-amber-700 border-amber-100',
            icon: Clock,
        },
        APPROVED: {
            label: 'Approved',
            cls: 'bg-green-50 text-green-700 border-green-100',
            icon: CheckCircle2,
        },
        REJECTED: {
            label: 'Rejected',
            cls: 'bg-red-50 text-red-700 border-red-100',
            icon: XCircle,
        },
        CANCELLED: {
            label: 'Cancelled',
            cls: 'bg-slate-50 text-slate-600 border-slate-100',
            icon: XCircle,
        },
    };
    const entry = map[status] || {
        label: status,
        cls: 'bg-slate-50 text-slate-600 border-slate-100',
        icon: Clock,
    };
    const Icon = entry.icon;

    return (
        <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${entry.cls}`}
        >
            <Icon className="size-3" />
            {entry.label}
        </span>
    );
}

export function BookingRequestModal({
    request,
    onApprove,
    onReject,
    isSubmitting = false,
    submittingAction = null,
    onClose,
}: BookingRequestModalProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'evidence'>('details');

    const bookingRef =
        request.vtId ||
        (request.id.length > 20 ? `VA-BKG-${request.id.slice(0, 8).toUpperCase()}` : request.id);
    const heroPhoto = request.sitePhotoUrl || request.sitePhotos?.[0] || null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-4xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col isolation-isolate border border-white/20"
            >
                {/* Hero / Header Section */}
                <div className="relative h-56 shrink-0 bg-slate-900 overflow-hidden">
                    {heroPhoto ? (
                        <img
                            src={heroPhoto}
                            alt={request.siteName}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/45 to-transparent" />
                    <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay" />

                    <div className="absolute bottom-5 left-6 right-6 z-20 flex items-end justify-between gap-4">
                        <div className="space-y-2 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                    Consented Infrastructure Access
                                </h2>
                                <StatusBadge status={request.status} />
                            </div>
                            <p className="text-blue-100 font-bold text-sm flex items-center gap-2">
                                <span className="uppercase tracking-[0.18em] text-[10px] opacity-70">
                                    Ref:
                                </span>
                                {bookingRef}
                            </p>
                            <p className="text-slate-200 text-sm font-medium line-clamp-2 max-w-2xl">
                                {request.siteName}{' '}
                                {request.siteAddress ? `• ${request.siteAddress}` : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div
                                className={`px-4 py-2 rounded-2xl border backdrop-blur-md flex items-center gap-2 ${request.useCategory === 'planned_toal' ? 'bg-blue-500/20 border-blue-400/30 text-blue-100' : 'bg-amber-500/20 border-amber-400/30 text-amber-100'}`}
                            >
                                {request.useCategory === 'planned_toal' ? (
                                    <Plane className="size-4" />
                                ) : (
                                    <Shield className="size-4" />
                                )}
                                <span className="text-xs font-black uppercase tracking-wider">
                                    {request.useCategory === 'planned_toal'
                                        ? 'Planned TOAL'
                                        : 'Emergency & Recovery'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 size-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-30"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="px-6 md:px-8 border-b border-slate-100 flex gap-8 bg-white">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 text-xs font-black uppercase tracking-[0.18em] border-b-2 transition-all ${activeTab === 'details' ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Operation Details
                    </button>
                    <button
                        onClick={() => setActiveTab('evidence')}
                        className={`py-4 text-xs font-black uppercase tracking-[0.18em] border-b-2 transition-all ${activeTab === 'evidence' ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Evidence & Documents
                        {request.providedDocuments && request.providedDocuments.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md text-[10px]">
                                {request.providedDocuments.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8 bg-slate-50/50">
                    <AnimatePresence mode="wait">
                        {activeTab === 'details' ? (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-6"
                            >
                                <div className="grid xl:grid-cols-[1.15fr,0.85fr] gap-6">
                                    {/* Mission / request summary */}
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <Info className="size-3 text-blue-600" />
                                                Primary Mission Objective
                                            </h3>
                                            <p className="text-base md:text-lg font-bold text-slate-800 leading-relaxed italic">
                                                "
                                                {request.missionIntent ||
                                                    'The operator has not provided a mission intent description.'}
                                                "
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-5">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <MapPin className="size-3 text-blue-600" />
                                                Site Snapshot
                                            </h3>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Site Name
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {request.siteName}
                                                    </p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Booking Ref
                                                    </p>
                                                    <p className="text-sm font-mono font-bold text-blue-700">
                                                        {bookingRef}
                                                    </p>
                                                </div>
                                                {request.siteAddress && (
                                                    <div className="sm:col-span-2 space-y-1.5">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            Address
                                                        </p>
                                                        <p className="text-sm text-slate-700 leading-relaxed">
                                                            {request.siteAddress}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Site Type
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {request.siteType || 'Operational Site'}
                                                    </p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Category
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {request.siteCategory || 'Standard'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Calendar className="size-3 text-blue-600" />
                                                Operational Window
                                            </h3>
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-blue-50 flex flex-col items-center justify-center text-blue-600 shrink-0">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter leading-none">
                                                        {new Date(
                                                            request.startTime
                                                        ).toLocaleDateString('en-GB', {
                                                            month: 'short',
                                                        })}
                                                    </span>
                                                    <span className="text-xl font-black leading-none">
                                                        {new Date(request.startTime).getDate()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base font-black text-slate-800 leading-none mb-1">
                                                        {new Date(
                                                            request.startTime
                                                        ).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}{' '}
                                                        —{' '}
                                                        {new Date(
                                                            request.endTime
                                                        ).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-medium truncate">
                                                        {new Date(
                                                            request.startTime
                                                        ).toLocaleDateString('en-GB', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Map thumbnail */}
                                        {request.siteGeometry ? (
                                            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <MapPin className="size-3 text-blue-600" />
                                                        Site Map
                                                    </h3>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                        Overview
                                                    </span>
                                                </div>
                                                <div className="h-64 rounded-2xl overflow-hidden border border-slate-200">
                                                    <ReadOnlySiteMap
                                                        geometry={request.siteGeometry}
                                                        clzGeometry={request.siteClzGeometry}
                                                        highlightMode="both"
                                                        showLegend
                                                    />
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Photo hero summary */}
                                        {heroPhoto && (
                                            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <ImageOff className="size-3 text-blue-600" />
                                                    Site Photo
                                                </h3>
                                                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                                                    <img
                                                        src={heroPhoto}
                                                        alt={request.siteName}
                                                        className="w-full h-52 object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-5">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Building2 className="size-3 text-blue-600" />
                                                Operator Personnel
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <User className="size-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-slate-800 truncate">
                                                            {request.operatorName ||
                                                                'Anonymous Operator'}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-medium truncate">
                                                            {request.operatorEmail}
                                                        </p>
                                                    </div>
                                                </div>
                                                {request.operatorOrganisation && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                            <Building2 className="size-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                                Organisation
                                                            </p>
                                                            <p className="text-xs font-bold text-slate-700 truncate">
                                                                {request.operatorOrganisation}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Flyer ID
                                                    </span>
                                                    <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                        {request.flyerId || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Plane className="size-3 text-blue-600" />
                                                Uncrewed Aircraft
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                                    <Plane className="size-5" />
                                                </div>
                                                <p className="text-sm font-black text-slate-800">
                                                    {request.droneModel || 'Unknown Model'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Schedule & Site */}
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Calendar className="size-3 text-blue-600" />
                                                Operational Window
                                            </h3>
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-blue-50 flex flex-col items-center justify-center text-blue-600">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter leading-none">
                                                        {new Date(
                                                            request.startTime
                                                        ).toLocaleDateString('en-GB', {
                                                            month: 'short',
                                                        })}
                                                    </span>
                                                    <span className="text-xl font-black leading-none">
                                                        {new Date(request.startTime).getDate()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base font-black text-slate-800 leading-none mb-1">
                                                        {new Date(
                                                            request.startTime
                                                        ).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}{' '}
                                                        —{' '}
                                                        {new Date(
                                                            request.endTime
                                                        ).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-medium truncate">
                                                        {new Date(
                                                            request.startTime
                                                        ).toLocaleDateString('en-GB', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <MapPin className="size-3 text-blue-600" />
                                                Infrastructure
                                            </h3>
                                            <div>
                                                <p className="text-base font-black text-slate-800 mb-1 leading-tight">
                                                    {request.siteName}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    Consented takeoff/landing point for this
                                                    operation.
                                                </p>
                                            </div>
                                        </div>

                                        {request.toalCost !== undefined && (
                                            <div className="bg-emerald-50/50 rounded-[24px] border border-emerald-100 p-5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600">
                                                        <Zap className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                            Access Fee
                                                        </p>
                                                        <p className="text-xs text-emerald-700 font-medium">
                                                            To be collected post-approval
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-xl font-black text-emerald-700">
                                                    £{request.toalCost.toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Operator & Aircraft */}
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm space-y-5">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <User className="size-3 text-blue-600" />
                                                Operator Personnel
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <User className="size-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-slate-800 truncate">
                                                            {request.operatorName ||
                                                                'Anonymous Operator'}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-medium truncate">
                                                            {request.operatorEmail}
                                                        </p>
                                                    </div>
                                                </div>

                                                {request.operatorOrganisation && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                            <Building2 className="size-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                                Organisation
                                                            </p>
                                                            <p className="text-xs font-bold text-slate-700 truncate">
                                                                {request.operatorOrganisation}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Flyer ID
                                                    </span>
                                                    <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                        {request.flyerId || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Plane className="size-3 text-blue-600" />
                                                Uncrewed Aircraft
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                                    <Plane className="size-5" />
                                                </div>
                                                <p className="text-sm font-black text-slate-800">
                                                    {request.droneModel || 'Unknown Model'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="evidence"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {request.providedDocuments &&
                                    request.providedDocuments.length > 0 ? (
                                        request.providedDocuments.map((doc, idx) => (
                                            <div
                                                key={idx}
                                                className="p-5 rounded-[24px] border border-slate-200 bg-white hover:border-blue-600/40 hover:shadow-xl hover:shadow-blue-500/5 transition-all group cursor-pointer"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="size-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                                        <FileText className="size-6 text-slate-400 group-hover:text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-slate-800 truncate mb-1">
                                                            {doc.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                            <span className="text-blue-600">
                                                                {doc.type}
                                                            </span>
                                                            <span className="size-1 rounded-full bg-slate-200" />
                                                            <span>{doc.fileSize}</span>
                                                        </div>
                                                    </div>
                                                    <Download className="size-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-y-0.5" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="sm:col-span-2 py-16 rounded-4xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                                            <div className="size-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4">
                                                <ShieldCheck className="size-8 text-slate-300" />
                                            </div>
                                            <h4 className="text-base font-black text-slate-800">
                                                No Evidence Provided
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
                                                The operator has not uploaded any specific insurance
                                                certificates or safety case documents for this
                                                request.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 rounded-[24px] bg-blue-50/50 border border-blue-100 space-y-3">
                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck className="size-3" />
                                        Platform Verification
                                    </h4>
                                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                        VertiAccess has verified this operator is registered and
                                        possesses a valid Flyer ID. However, as a landowner, you
                                        should ensure they meet your specific site insurance
                                        requirements.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sticky Footer Actions */}
                <div className="p-8 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <AlertCircle className="size-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-800">
                                Review Responsibility
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                                Approval grants formal land access consent.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {request.status === 'PENDING' ? (
                            <>
                                <button
                                    onClick={onReject}
                                    disabled={isSubmitting}
                                    className="h-14 px-8 border border-slate-200 text-slate-600 rounded-[20px] font-black text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isSubmitting && submittingAction === 'REJECT' ? (
                                        <div className="flex items-center gap-2">
                                            <Spinner size="sm" className="size-4" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        'Reject Request'
                                    )}
                                </button>
                                <button
                                    onClick={onApprove}
                                    disabled={isSubmitting}
                                    className="h-14 px-10 bg-blue-600 text-white rounded-[20px] font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 group"
                                >
                                    {isSubmitting && submittingAction === 'APPROVE' ? (
                                        <div className="flex items-center gap-2">
                                            <Spinner size="sm" className="size-4 text-white" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span>Approve Access</span>
                                            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="h-14 px-10 bg-slate-100 text-slate-900 rounded-[20px] font-black text-sm hover:bg-slate-200 transition-all active:scale-[0.98]"
                            >
                                Close Details
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
