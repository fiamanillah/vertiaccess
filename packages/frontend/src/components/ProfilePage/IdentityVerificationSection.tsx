import type { RefObject } from 'react';
import type { User } from '../../App';
import { ShieldCheck, Loader2, Upload, FileText, X, IdCard, Globe } from 'lucide-react';
import type { OperatorIdentityDoc, OperatorSupportingDoc } from './ProfileTypes';

interface IdentityVerificationSectionProps {
    user: User;
    verificationSectionRef: RefObject<HTMLDivElement | null>;
    identificationDocType: 'national_id' | 'passport';
    setIdentificationDocType: (value: 'national_id' | 'passport') => void;
    isUploadingId: boolean;
    onIdentificationUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    operatorIdentityDoc: OperatorIdentityDoc | null;
    setOperatorIdentityDoc: (doc: OperatorIdentityDoc | null) => void;
    operatorSupportingDocs: OperatorSupportingDoc[];
    isUploadingOperatorDoc: boolean;
    onOperatorDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    onRemoveOperatorDocument: (fileKey: string) => void;
    onSubmitOperatorVerification: () => Promise<void>;
    isSubmittingOperatorVerification: boolean;
    onRemoveIdentification: () => void;
}

function VerificationStateCard({
    icon,
    title,
    description,
    statusLabel,
    statusClassName,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    statusLabel: string;
    statusClassName: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-8 rounded-2xl  bg-slate-50/50 space-y-3">
            <div className="size-16 rounded-full flex items-center justify-center shadow-inner bg-white text-slate-700 border border-slate-200">
                {icon}
            </div>
            <div className="text-center px-4">
                <p className="text-lg font-black text-slate-900">{title}</p>
                <p className="text-sm text-slate-500 max-w-2xl mt-1">{description}</p>
            </div>
            <div
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 ${statusClassName}`}
            >
                <div className="size-2 rounded-full animate-pulse bg-current" />
                {statusLabel}
            </div>
        </div>
    );
}

export function IdentityVerificationSection({
    user,
    verificationSectionRef,
    identificationDocType,
    setIdentificationDocType,
    isUploadingId,
    onIdentificationUpload,
    operatorIdentityDoc,
    setOperatorIdentityDoc,
    operatorSupportingDocs,
    isUploadingOperatorDoc,
    onOperatorDocumentUpload,
    onRemoveOperatorDocument,
    onSubmitOperatorVerification,
    isSubmittingOperatorVerification,
    onRemoveIdentification,
}: IdentityVerificationSectionProps) {
    return (
        <div ref={verificationSectionRef}>
            {user.verificationStatus === 'VERIFIED' ? (
                <VerificationStateCard
                    icon={<ShieldCheck className="size-8 text-emerald-600" />}
                    title="Account Verified"
                    description={`Your ${user.role === 'operator' ? 'operator credentials have' : 'identity has'} been fully verified. You have full access to all platform features.`}
                    statusLabel="Status: Fully Verified"
                    statusClassName="text-emerald-700 bg-emerald-50"
                />
            ) : user.hasPendingVerification ? (
                <VerificationStateCard
                    icon={<Loader2 className="size-8 animate-spin text-amber-600" />}
                    title="Verification Under Review"
                    description={`Your ${user.role === 'operator' ? 'operator credentials have' : 'identity document has'} been submitted and is being reviewed by our team. We will notify you once a decision has been made.`}
                    statusLabel="Status: Pending Review"
                    statusClassName="text-amber-700 bg-amber-50"
                />
            ) : user.role === 'operator' ? (
                <div className="space-y-4 rounded-2xl border border-slate-200 p-4 md:p-5">
                    <div>
                        <p className="text-sm font-black text-blue-900 mb-1">
                            How operator verification works
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            We review your Flyer ID and Operator Reference against CAA records. Once
                            approved, your account becomes fully verified.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Flyer ID
                            </p>
                            <p className="text-sm font-black text-slate-800 font-mono uppercase">
                                {user.flyerId || <span className="text-red-500">Not set</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Operator Reference
                            </p>
                            <p className="text-sm font-black text-slate-800 font-mono uppercase">
                                {user.operatorId || '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Full Name
                            </p>
                            <p className="text-sm font-black text-slate-800">
                                {user.fullName || '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Organisation
                            </p>
                            <p className="text-sm font-black text-slate-800">
                                {user.organisation || 'Independent'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-3">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            Identity Document (Required)
                        </p>
                        {operatorIdentityDoc ? (
                            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        {operatorIdentityDoc.fileName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {operatorIdentityDoc.type.replace('_', ' ')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setOperatorIdentityDoc(null)}
                                    className="text-xs font-bold text-red-600 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIdentificationDocType('national_id')}
                                        className={`flex-1 p-2 rounded-lg border text-xs font-bold ${identificationDocType === 'national_id' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        National ID
                                    </button>
                                    <button
                                        onClick={() => setIdentificationDocType('passport')}
                                        className={`flex-1 p-2 rounded-lg border text-xs font-bold ${identificationDocType === 'passport' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Passport
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    id="op-id-upload"
                                    className="hidden"
                                    onChange={onIdentificationUpload}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                <label
                                    htmlFor="op-id-upload"
                                    className="flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-slate-300 bg-white text-slate-600 text-sm font-bold hover:border-blue-600 hover:bg-blue-50 cursor-pointer transition-all"
                                >
                                    {isUploadingId ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" /> Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="size-4" /> Upload{' '}
                                            {identificationDocType.replace('_', ' ')}
                                        </>
                                    )}
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-3">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            Supporting Documents (Required)
                        </p>
                        <input
                            id="operator-doc-upload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={onOperatorDocumentUpload}
                        />
                        <label
                            htmlFor="operator-doc-upload"
                            className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-bold hover:bg-slate-100 cursor-pointer"
                        >
                            {isUploadingOperatorDoc ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" /> Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="size-4" /> Add supporting document
                                </>
                            )}
                        </label>

                        {operatorSupportingDocs.length > 0 && (
                            <div className="space-y-2">
                                {operatorSupportingDocs.map(doc => (
                                    <div
                                        key={doc.fileKey}
                                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                {doc.fileName}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Uploaded{' '}
                                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveOperatorDocument(doc.fileKey)}
                                            className="text-xs font-bold text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onSubmitOperatorVerification}
                        disabled={
                            isSubmittingOperatorVerification ||
                            !user.flyerId ||
                            !operatorIdentityDoc ||
                            operatorSupportingDocs.length === 0
                        }
                        className="w-full h-11 bg-blue-600 text-white rounded-xl font-black uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmittingOperatorVerification ? (
                            <>
                                <Loader2 className="size-4 animate-spin" /> Submitting...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="size-4" /> Submit for Verification
                            </>
                        )}
                    </button>
                    {!user.flyerId && (
                        <p className="text-xs text-red-500 font-bold text-center">
                            Please add your Flyer ID in Account Overview before submitting.
                        </p>
                    )}
                </div>
            ) : user.identificationDocument ? (
                <div className="flex items-center justify-between p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                            <FileText className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                {user.identificationDocument.fileName}
                            </p>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                {user.identificationDocument.type.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={user.identificationDocument.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-3 bg-white text-slate-600 rounded-lg text-xs font-bold flex items-center border border-slate-200 hover:bg-slate-50"
                        >
                            View
                        </a>
                        <button
                            onClick={onRemoveIdentification}
                            className="size-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 border border-red-100"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 rounded-2xl border border-slate-200 p-4 md:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={() => setIdentificationDocType('national_id')}
                            className={`p-3 rounded-xl border-2 transition-all text-left ${identificationDocType === 'national_id' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        >
                            <div className="size-7 rounded-lg flex items-center justify-center mb-2 bg-slate-100 text-slate-500">
                                <IdCard className="size-4" />
                            </div>
                            <p className="text-sm font-bold text-slate-900">National ID Card</p>
                            <p className="text-xs text-slate-500 mt-1">Government photo ID</p>
                        </button>
                        <button
                            onClick={() => setIdentificationDocType('passport')}
                            className={`p-3 rounded-xl border-2 transition-all text-left ${identificationDocType === 'passport' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        >
                            <div className="size-7 rounded-lg flex items-center justify-center mb-2 bg-slate-100 text-slate-500">
                                <Globe className="size-4" />
                            </div>
                            <p className="text-sm font-bold text-slate-900">Passport</p>
                            <p className="text-xs text-slate-500 mt-1">
                                International travel document
                            </p>
                        </button>
                    </div>

                    <input
                        type="file"
                        id="id-upload"
                        className="hidden"
                        onChange={onIdentificationUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label
                        htmlFor="id-upload"
                        className="flex flex-col items-center justify-center p-5 bg-slate-50/50 border border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all"
                    >
                        <div className="size-10 bg-white rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                            {isUploadingId ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <Upload className="size-5" />
                            )}
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                            {isUploadingId
                                ? 'Uploading...'
                                : `Upload ${identificationDocType.replace('_', ' ')}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">PDF, JPG or PNG up to 10MB</p>
                    </label>
                </div>
            )}
        </div>
    );
}
