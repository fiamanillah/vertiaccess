import React from 'react';
import type { IncidentReport, Site } from '../types';
import {
    X,
    MapPin,
    Calendar,
    Clock,
    AlertTriangle,
    Shield,
    MessageSquare,
    User,
    FileText,
    Download,
    CheckCircle,
    ExternalLink,
    Camera,
    ShieldAlert,
    ShieldCheck,
    AlertCircle,
    Gavel,
    Ban,
    Briefcase,
    Info,
    Send,
    Plus,
    Paperclip,
    FilePlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { RelatedDocument } from '../types';
import { useReactToPrint } from 'react-to-print';

interface IncidentDetailModalProps {
    incident: IncidentReport;
    userRole?: 'admin' | 'operator' | 'landowner';
    userName?: string;
    onClose: () => void;
    onUpdateStatus: (status: IncidentReport['status']) => void;
    onAddNote: (note: string) => void | Promise<void>;
    onAddDocument?: (
        doc: Omit<RelatedDocument, 'id' | 'uploadedAt' | 'uploadedBy'>
    ) => void | Promise<void>;
    onBlockSite: (siteId: string) => void;
}

export function IncidentDetailModal({
    incident,
    userRole = 'admin',
    userName = 'Admin',
    onClose,
    onUpdateStatus,
    onAddNote,
    onAddDocument,
    onBlockSite,
}: IncidentDetailModalProps) {
    const [activeTab, setActiveTab] = React.useState<'overview' | 'evidence'>('overview');
    const [newMessage, setNewMessage] = React.useState('');
    const [isSubmittingMessage, setIsSubmittingMessage] = React.useState(false);
    const [isUploadingDocument, setIsUploadingDocument] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const overviewPrintRef = React.useRef<HTMLDivElement>(null);
    const evidencePrintRef = React.useRef<HTMLDivElement>(null);

    const handleExportReport = useReactToPrint({
        contentRef: overviewPrintRef,
        documentTitle: `VertiAccess_Incident_Report_${incident.id}`,
        pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
    });

    const handleDownloadEvidence = useReactToPrint({
        contentRef: evidencePrintRef,
        documentTitle: `VertiAccess_Incident_Evidence_${incident.id}`,
        pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
    });

    const severityColors = {
        low: 'bg-blue-100 text-blue-700 border-blue-200',
        medium: 'bg-amber-100 text-amber-700 border-amber-200',
        high: 'bg-orange-100 text-orange-700 border-orange-200',
        critical: 'bg-red-600 text-white border-red-700',
    };

    const statusColors: Record<IncidentReport['status'], string> = {
        OPEN: 'bg-red-100 text-red-700 border-red-200',
        UNDER_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
        RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    // Mock initial messages if none exist
    const displayMessages =
        incident.messages && incident.messages.length > 0
            ? incident.messages
            : [
                  {
                      role: 'landowner',
                      sender: incident.landownerName,
                      text: incident.description,
                      timestamp: incident.createdAt,
                  },
              ];

    const handleSubmitMessage = async () => {
        const trimmedMessage = newMessage.trim();

        if (!trimmedMessage) {
            return;
        }

        setIsSubmittingMessage(true);
        try {
            await onAddNote(trimmedMessage);
            setNewMessage('');
        } finally {
            setIsSubmittingMessage(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl max-w-5xl w-full h-[85vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col isolation-isolate"
            >
                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-6">
                        <div
                            className={`size-14 rounded-2xl flex items-center justify-center shadow-lg ${
                                incident.urgency === 'critical'
                                    ? 'bg-red-600 shadow-red-500/20'
                                    : 'bg-slate-900 shadow-slate-900/10'
                            }`}
                        >
                            <ShieldAlert className="size-7 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-[28px] font-black text-slate-800 tracking-tight">
                                    Case: {incident.id}
                                </h2>
                                <span
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusColors[incident.status]}`}
                                >
                                    {incident.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                Formal Safety Investigation Workflow
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-12 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all"
                    >
                        <X className="size-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-10 border-b border-slate-100 bg-white flex gap-10 shrink-0">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-6 text-sm font-black uppercase tracking-widest relative transition-all ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'}`}
                    >
                        Investigation Overview
                        {activeTab === 'overview' && (
                            <motion.div
                                layoutId="incTab"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('evidence')}
                        className={`py-6 text-sm font-black uppercase tracking-widest relative transition-all ${activeTab === 'evidence' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'}`}
                    >
                        Evidence & Assets
                        {activeTab === 'evidence' && (
                            <motion.div
                                layoutId="incTab"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                            />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-10 custom-scrollbar">
                    {activeTab === 'overview' && (
                        <div
                            ref={overviewPrintRef}
                            className="grid lg:grid-cols-[1fr,320px] gap-10"
                        >
                            <div className="space-y-10">
                                {/* Information Submitted Section */}
                                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                            Reported Details
                                        </h3>
                                        <div
                                            className={`px-4 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${severityColors[incident.urgency]}`}
                                        >
                                            {incident.urgency} Urgency
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Incident Type
                                            </p>
                                            <p className="text-base font-bold text-slate-800 capitalize">
                                                {incident.type.replace(/_/g, ' ')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Occurrence Date/Time
                                            </p>
                                            <p className="text-base font-bold text-slate-800">
                                                {incident.incidentDateTime
                                                    ? new Date(
                                                          incident.incidentDateTime
                                                      ).toLocaleString('en-GB', {
                                                          day: '2-digit',
                                                          month: 'short',
                                                          year: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                      })
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Booking Reference
                                            </p>
                                            <p className="text-base font-mono font-bold text-blue-600">
                                                {incident.bookingId || 'No Booking Linked'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Site Location
                                            </p>
                                            <p className="text-base font-bold text-slate-800">
                                                {incident.siteName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Involved Operator
                                            </p>
                                            <p className="text-base font-bold text-slate-800">
                                                {incident.operatorName || 'Unknown'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Insurance Notified
                                            </p>
                                            <p
                                                className={`text-base font-bold ${incident.insuranceNotified ? 'text-emerald-600' : 'text-amber-600'}`}
                                            >
                                                {incident.insuranceNotified === true
                                                    ? 'Yes'
                                                    : incident.insuranceNotified === false
                                                      ? 'No'
                                                      : 'Not Reported'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">
                                            Event Description
                                        </p>
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-base text-slate-600 leading-relaxed italic">
                                            "{incident.description}"
                                        </div>
                                    </div>
                                </div>

                                {/* Case Communication Section */}
                                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm space-y-8 flex flex-col h-125">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                            Case Communication
                                        </h3>
                                        <div className="flex gap-4 text-xs font-bold text-slate-400">
                                            <span>Operator: {incident.operatorName || 'N/A'}</span>
                                            <span>Landowner: {incident.landownerName}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                                        {displayMessages.map((msg, i) => (
                                            <div
                                                key={i}
                                                className={`flex flex-col ${msg.role === userRole ? 'items-end' : 'items-start'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        {msg.sender} ({msg.role})
                                                    </span>
                                                    <span className="text-[10px] text-slate-300">
                                                        {new Date(msg.timestamp).toLocaleTimeString(
                                                            [],
                                                            { hour: '2-digit', minute: '2-digit' }
                                                        )}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                                                        msg.role === userRole
                                                            ? 'bg-slate-900 text-white rounded-tr-none'
                                                            : 'bg-slate-50 text-slate-600 border border-slate-100 rounded-tl-none'
                                                    }`}
                                                >
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 space-y-4">
                                        <div className="relative group">
                                            <textarea
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                placeholder={`Reply to this case as ${userRole}...`}
                                                className="w-full h-24 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all text-sm font-medium resize-none pr-14"
                                            />
                                            <button
                                                onClick={() => {
                                                    void handleSubmitMessage();
                                                }}
                                                disabled={!newMessage.trim() || isSubmittingMessage}
                                                className="absolute bottom-4 right-4 size-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-[#0036CC] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Send
                                                    className={`size-5 ${isSubmittingMessage ? 'animate-pulse' : ''}`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Actions */}
                            <div className="space-y-6">
                                {userRole === 'admin' && (
                                    <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm space-y-6">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                            Case Management
                                        </h4>

                                        <div className="space-y-4">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                Update Status
                                            </p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'].map(
                                                    status => (
                                                        <button
                                                            key={status}
                                                            onClick={() =>
                                                                onUpdateStatus(
                                                                    status as IncidentReport['status']
                                                                )
                                                            }
                                                            className={`w-full h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                                                                incident.status === status
                                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <span className="capitalize">
                                                                {status.replace(/_/g, ' ')}
                                                            </span>
                                                            {incident.status === status && (
                                                                <CheckCircle className="size-4" />
                                                            )}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-100 space-y-4">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                Enforcement Actions
                                            </p>
                                            <button
                                                onClick={() => onBlockSite(incident.siteId)}
                                                className="w-full h-12 bg-white border-2 border-red-100 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                                            >
                                                <Ban className="size-4" />
                                                Restrict Site Access
                                            </button>
                                            <button className="w-full h-12 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                                                <Gavel className="size-4" />
                                                Suspend Operator
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-slate-900 rounded-[28px] p-8 shadow-xl space-y-6 text-white">
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="size-5 text-blue-400" />
                                        <h4 className="text-sm font-black uppercase tracking-widest">
                                            Export Safety Data
                                        </h4>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                        Generate a formal CAA-compliant safety occurrence report for
                                        this case.
                                    </p>
                                    <button
                                        onClick={() => {
                                            void handleExportReport?.();
                                        }}
                                        className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Download className="size-4" />
                                        Export PDF Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'evidence' && (
                        <div ref={evidencePrintRef} className="space-y-10">
                            <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                        Submitted Photographic Evidence
                                    </h3>
                                    <button
                                        onClick={() => {
                                            void handleDownloadEvidence?.();
                                        }}
                                        className="text-sm font-bold text-blue-600 flex items-center gap-2 hover:underline"
                                    >
                                        <Download className="size-4" />
                                        Download All Evidence
                                    </button>
                                </div>

                                {incident.photos && incident.photos.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {incident.photos.map((photo, i) => (
                                            <div
                                                key={i}
                                                className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-100 group relative cursor-pointer shadow-sm hover:shadow-xl transition-all"
                                            >
                                                <ImageWithFallback
                                                    src={photo}
                                                    alt={`Evidence ${i + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ExternalLink className="size-6 text-white" />
                                                </div>
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-lg">
                                                        Evidence-0{i + 1}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-24 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <Camera className="size-16 text-slate-200 mx-auto mb-6" />
                                        <p className="text-base font-bold text-slate-400">
                                            No photographic evidence was submitted with this report.
                                        </p>
                                        <p className="text-sm text-slate-400 mt-2">
                                            Parties are encouraged to upload images of site
                                            conditions or damage.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                        Related Documentation
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={async e => {
                                                const file = e.target.files?.[0];
                                                if (!file || !onAddDocument) {
                                                    e.currentTarget.value = '';
                                                    return;
                                                }

                                                setIsUploadingDocument(true);
                                                try {
                                                    await onAddDocument({
                                                        name: file.name,
                                                        type:
                                                            file.type
                                                                .split('/')[1]
                                                                ?.toUpperCase() || 'FILE',
                                                        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                                                    });
                                                } finally {
                                                    e.currentTarget.value = '';
                                                    setIsUploadingDocument(false);
                                                }
                                            }}
                                        />
                                        {onAddDocument && (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploadingDocument}
                                                className="h-10 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#0036CC] transition-all shadow-lg shadow-blue-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <Plus
                                                    className={`size-4 ${isUploadingDocument ? 'animate-pulse' : ''}`}
                                                />
                                                {isUploadingDocument
                                                    ? 'Uploading...'
                                                    : 'Add Document'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {incident.relatedDocumentation &&
                                    incident.relatedDocumentation.length > 0 ? (
                                        incident.relatedDocumentation.map((doc, i) => (
                                            <div
                                                key={doc.id || i}
                                                className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-600/20 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors border border-slate-100">
                                                        <FileText className="size-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {doc.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                                            {doc.type} • {doc.size} •{' '}
                                                            {doc.uploadedBy || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Download className="size-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <FilePlus className="size-10 text-slate-200 mx-auto mb-4" />
                                            <p className="text-sm font-bold text-slate-400">
                                                No documentation uploaded yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Info className="size-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">
                            Case Audit Trail Locked • {new Date().getFullYear()} VertiAccess
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-12 px-8 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
                    >
                        Close Case View
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
