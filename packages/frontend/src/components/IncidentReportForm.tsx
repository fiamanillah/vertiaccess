import { useRef, useState } from 'react';
import type { Site, IncidentType, IncidentUrgency, IncidentReport, BookingRequest } from '../types';
import {
    AlertTriangle,
    Upload,
    Camera,
    ShieldAlert,
    Clock,
    ChevronRight,
    CheckCircle2,
    X,
    AlertCircle,
    UserMinus,
    Info,
    PlaneLanding,
    ShieldX,
    HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateVTID } from '../utils/idGenerator';

interface IncidentReportFormProps {
    sites: Site[];
    preselectedBooking?: BookingRequest;
    userRole?: 'landowner' | 'operator';
    onClose: () => void;
    onSubmit: (
        report: IncidentReport,
        photoEvidence?: { name: string; type: string; size: string }[]
    ) => Promise<string | void> | string | void;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function IncidentReportForm({
    sites,
    preselectedBooking,
    userRole = 'landowner',
    onClose,
    onSubmit,
}: IncidentReportFormProps) {
    const [step, setStep] = useState(1);
    const [siteId, setSiteId] = useState(preselectedBooking?.siteId || sites[0]?.id || '');
    const [bookingId, setBookingId] = useState(preselectedBooking?.id || '');
    const [type, setType] = useState<IncidentType>(
        userRole === 'operator' ? 'hard_landing' : 'breach_of_conditions'
    );
    const [description, setDescription] = useState('');
    const [incidentDateTime, setIncidentDateTime] = useState(new Date().toISOString().slice(0, 16));
    const [insuranceNotified, setInsuranceNotified] = useState(false);
    const [photos, setPhotos] = useState<
        { id: string; name: string; size: string; type: string }[]
    >([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        const mappedFiles = files
            .filter(file => file.type.startsWith('image/'))
            .map(file => ({
                id: `${file.name}-${file.size}-${file.lastModified}`,
                name: file.name,
                size: formatFileSize(file.size),
                type: file.type,
            }));

        setPhotos(prev => {
            const next = [...prev];
            for (const file of mappedFiles) {
                if (!next.some(existing => existing.id === file.id)) {
                    next.push(file);
                }
            }
            return next;
        });

        event.target.value = '';
    };

    const handleRemovePhoto = (photoId: string) => {
        setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionError(null);

        try {
            const selectedSite = sites.find(s => s.id === siteId);
            const newReport: IncidentReport = {
                id: generateVTID('vt-inc'),
                landownerId: selectedSite?.landownerId || 'unknown',
                landownerName: selectedSite?.landownerName || 'Property Owner',
                siteId,
                siteName: selectedSite?.name || 'Unknown Site',
                bookingId: bookingId || undefined,
                type,
                urgency: 'high',
                description,
                photos: photos.length > 0 ? photos.map(photo => photo.name) : undefined,
                status: userRole === 'operator' ? 'UNDER_REVIEW' : 'OPEN',
                createdAt: new Date().toISOString(),
                incidentDateTime: new Date(incidentDateTime).toISOString(),
                insuranceNotified: userRole === 'operator' ? insuranceNotified : undefined,
            };

            const submittedId = await Promise.resolve(
                onSubmit(
                    newReport,
                    photos.map(photo => ({
                        name: photo.name,
                        type: photo.type || 'image/jpeg',
                        size: photo.size,
                    }))
                )
            );
            setSubmittedCaseId(typeof submittedId === 'string' ? submittedId : newReport.id);
            setIsSuccess(true);
        } catch (error: any) {
            setSubmissionError(error?.message || 'Failed to submit incident report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const landownerIncidentTypes: { value: IncidentType; label: string; icon: any }[] = [
        { value: 'breach_of_conditions', label: 'Breach of Conditions', icon: ShieldAlert },
        { value: 'damage_observed', label: 'Damage Observed', icon: AlertTriangle },
        { value: 'unapproved_flight', label: 'Unapproved Flight', icon: Camera },
        { value: 'safety_concern', label: 'Safety Concern', icon: AlertTriangle },
        { value: 'public_complaint', label: 'Public Complaint', icon: AlertTriangle },
        { value: 'noise_issue', label: 'Noise Issue', icon: Info },
        { value: 'other', label: 'Other', icon: HelpCircle },
    ];

    const operatorIncidentTypes: { value: IncidentType; label: string; icon: any }[] = [
        { value: 'hard_landing', label: 'Hard Landing', icon: PlaneLanding },
        { value: 'emergency_recovery_usage', label: 'Emergency Recovery Usage', icon: ShieldAlert },
        { value: 'property_damage', label: 'Damage to Property', icon: AlertTriangle },
        { value: 'injury', label: 'Injury (if any)', icon: ShieldX },
        { value: 'near_miss', label: 'Near Miss', icon: AlertCircle },
        { value: 'site_access_issue', label: 'Site Access Issue', icon: UserMinus },
        { value: 'landowner_dispute', label: 'Landowner Dispute', icon: HelpCircle },
        { value: 'third_party_complaint', label: 'Third-party Complaint', icon: AlertTriangle },
        { value: 'other', label: 'Other', icon: HelpCircle },
    ];

    const activeTypes = userRole === 'operator' ? operatorIncidentTypes : landownerIncidentTypes;

    if (isSuccess) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center max-w-lg mx-auto border border-slate-200 shadow-sm">
                <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="size-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Incident Reported</h2>
                <p className="text-slate-600 mb-8">
                    Your report has been submitted to the VertiAccess Safety & Compliance team. Case
                    ID: <span className="font-mono font-bold text-blue-600">{submittedCaseId}</span>
                </p>
                <button
                    onClick={onClose}
                    className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-2xl mx-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Safety Incident Report</h2>
                    <p className="text-sm text-slate-500">
                        {userRole === 'operator'
                            ? 'Report operational safety events or site-related issues.'
                            : 'Submit operational or structural concerns to VertiAccess Admin.'}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-all">
                    <X className="size-5 text-slate-400" />
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar"
            >
                {submissionError && (
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm font-medium text-red-700">
                        {submissionError}
                    </div>
                )}

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                Site Location
                            </label>
                            <select
                                value={siteId}
                                onChange={e => setSiteId(e.target.value)}
                                disabled={!!preselectedBooking}
                                className={`w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600/20 transition-all ${preselectedBooking ? 'opacity-60 cursor-not-allowed' : ''}`}
                                required
                            >
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>
                                        {site.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                Booking ID
                            </label>
                            <input
                                type="text"
                                value={bookingId}
                                onChange={e => setBookingId(e.target.value)}
                                readOnly={!!preselectedBooking}
                                placeholder="Booking ID"
                                className={`w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-600/20 transition-all ${preselectedBooking ? 'opacity-60 cursor-not-allowed' : ''}`}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                            Date & Time of Incident
                        </label>
                        <input
                            type="datetime-local"
                            value={incidentDateTime}
                            onChange={e => setIncidentDateTime(e.target.value)}
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                            Incident Type
                        </label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value as IncidentType)}
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none cursor-pointer"
                            required
                        >
                            {activeTypes.map(iType => (
                                <option key={iType.value} value={iType.value}>
                                    {iType.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                            Description of Incident
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Provide a detailed account of the event..."
                            className="w-full min-h-25 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600/20 transition-all resize-none"
                            required
                        />
                    </div>

                    {userRole === 'operator' && (
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                Insurance Notified?
                            </label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setInsuranceNotified(true)}
                                    className={`flex-1 h-11 rounded-xl border font-bold text-sm transition-all ${
                                        insuranceNotified
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-200'
                                    }`}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInsuranceNotified(false)}
                                    className={`flex-1 h-11 rounded-xl border font-bold text-sm transition-all ${
                                        !insuranceNotified
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200'
                                    }`}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                            Photo Evidence
                        </label>
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoSelect}
                            className="hidden"
                        />
                        <div className="grid grid-cols-4 gap-3">
                            <button
                                type="button"
                                onClick={() => photoInputRef.current?.click()}
                                className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-blue-600/30 transition-all group"
                            >
                                <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50">
                                    <Upload className="size-4 text-slate-400 group-hover:text-blue-600" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 uppercase">
                                    Upload
                                </span>
                            </button>

                            {photos.map(photo => (
                                <div
                                    key={photo.id}
                                    className="relative aspect-square rounded-xl border border-slate-200 bg-slate-50 p-2 flex flex-col justify-between"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePhoto(photo.id)}
                                        className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-slate-500 hover:text-red-600"
                                        aria-label={`Remove ${photo.name}`}
                                    >
                                        <X className="size-3" />
                                    </button>
                                    <div className="pt-2">
                                        <p className="text-[11px] font-semibold text-slate-700 line-clamp-3">
                                            {photo.name}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-slate-500">{photo.size}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-2 h-12 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <ShieldAlert className="size-4" />
                                Submit Safety Report
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
