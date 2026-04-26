import { SectionTitle } from './SectionTitle';
import { Image as ImageIcon, FileText, AlertCircle, ShieldCheck, FileDigit } from 'lucide-react';

interface MediaSectionProps {
    sitePhotos: string[];
    policyDocumentItems: { fileName: string; downloadUrl?: string }[];
    ownershipDocumentItems: { fileName: string; downloadUrl?: string }[];
    allUploadedDocuments: {
        id: string;
        fileName: string;
        documentType?: string;
        downloadUrl?: string;
        uploadedAt?: string;
    }[];
}

export function MediaSection({
    sitePhotos,
    policyDocumentItems,
    ownershipDocumentItems,
    allUploadedDocuments,
}: MediaSectionProps) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <SectionTitle>Media & Documentation</SectionTitle>
            <div className="space-y-4">
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center justify-between">
                        Site Photos
                        <span className="text-blue-600 normal-case font-bold">
                            {sitePhotos.length} files
                        </span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {sitePhotos.length > 0 ? (
                            sitePhotos.map((photo, idx) => (
                                <div
                                    key={idx}
                                    className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50"
                                >
                                    <img
                                        src={photo}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 h-20 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center bg-slate-50">
                                <ImageIcon className="size-5 text-slate-300" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase mb-3">
                        Policy Documents
                    </p>
                    <div className="space-y-2">
                        {policyDocumentItems.length > 0 ? (
                            policyDocumentItems.map((doc, idx) => (
                                <div
                                    key={`${doc.fileName}-${idx}`}
                                    className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100"
                                >
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div className="size-7 bg-white rounded flex items-center justify-center border border-slate-200 text-blue-600">
                                            <FileText className="size-3.5" />
                                        </div>
                                        <span className="text-xs text-slate-600 font-medium truncate">
                                            {doc.fileName}
                                        </span>
                                    </div>
                                    <a
                                        href={doc.downloadUrl || 'about:blank'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                                    >
                                        View
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-3">
                                <AlertCircle className="size-4 text-amber-600" />
                                <span className="text-xs text-amber-700 font-bold italic">
                                    No policy documents uploaded.
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center justify-between">
                        Ownership & Authority
                    </p>
                    <div className="space-y-2">
                        {ownershipDocumentItems.length > 0 ? (
                            ownershipDocumentItems.map((doc, idx) => (
                                <div
                                    key={`${doc.fileName}-${idx}`}
                                    className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100 group hover:border-blue-600/30 transition-colors"
                                >
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div className="size-7 bg-white rounded flex items-center justify-center border border-slate-200 text-emerald-600 transition-colors">
                                            <ShieldCheck className="size-3.5" />
                                        </div>
                                        <span className="text-xs text-slate-600 font-medium truncate">
                                            {doc.fileName}
                                        </span>
                                    </div>
                                    <a
                                        href={doc.downloadUrl || 'about:blank'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                                    >
                                        View
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-3">
                                <AlertCircle className="size-4 text-amber-600" />
                                <span className="text-xs text-amber-700 font-bold italic">
                                    No ownership evidence provided.
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center justify-between">
                        All Uploaded Documents
                        <span className="text-blue-600 normal-case font-bold">
                            {allUploadedDocuments.length} files
                        </span>
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {allUploadedDocuments.length > 0 ? (
                            allUploadedDocuments.map(doc => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100"
                                >
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div className="size-7 bg-white rounded flex items-center justify-center border border-slate-200 text-slate-600">
                                            <FileDigit className="size-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-700 font-medium truncate">
                                                {doc.fileName}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                {doc.documentType || 'document'}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={doc.downloadUrl || 'about:blank'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                                    >
                                        View
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
                                <span className="text-xs text-slate-500 font-medium italic">
                                    No documents submitted.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
