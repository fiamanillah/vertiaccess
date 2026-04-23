import { motion } from 'motion/react';
import { ShieldCheck, ExternalLink, Download, FileText } from 'lucide-react';
import type { ConsentCertificate } from '../../types';
import { Skeleton } from '../ui/skeleton';

interface OperatorCertificatesSectionProps {
    certificates: ConsentCertificate[];
    isLoading?: boolean;
    onSelectCertificate: (cert: ConsentCertificate) => void;
}

export function OperatorCertificatesSection({
    certificates,
    isLoading = false,
    onSelectCertificate,
}: OperatorCertificatesSectionProps) {
    return (
        <div>
            {isLoading && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-blue-100">
                        <div className="size-3 rounded-full bg-blue-600 animate-pulse" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700">Loading certificates</p>
                        <p className="text-xs text-slate-500">Preparing your consent records...</p>
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between space-y-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <Skeleton className="size-12 rounded-xl" />
                                <div className="flex-1 space-y-2 text-right">
                                    <Skeleton className="h-3 w-24 ml-auto" />
                                    <Skeleton className="h-3 w-32 ml-auto" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-4 w-48 opacity-50" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-6 w-28" />
                                <Skeleton className="h-6 w-36" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Skeleton className="h-10 flex-1 rounded-lg" />
                                <Skeleton className="size-10 rounded-lg" />
                            </div>
                        </div>
                    ))
                ) : certificates.length > 0 ? (
                    certificates.map(cert => (
                        <motion.div
                            key={cert.id}
                            whileHover={{ y: -4 }}
                            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <ShieldCheck className="size-7" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Digital Consent Reference
                                    </p>
                                    <p className="font-mono text-xs font-bold text-slate-900">
                                        {cert.id.slice(0, 13)}...
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-1 text-lg font-bold text-slate-900">{cert.siteName}</h3>
                                <p className="mb-4 text-sm text-slate-500">{cert.siteAddress}</p>
                                <div className="mb-6 flex flex-wrap gap-2">
                                    <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                                        Issued: {new Date(cert.issueDate).toLocaleDateString()}
                                    </span>
                                    <span className="rounded bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase text-indigo-700">
                                        Booking reference: {cert.operationReference}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => onSelectCertificate(cert)}
                                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900 transition-all hover:bg-slate-50"
                                >
                                    <ExternalLink className="size-4" />
                                    View Full Certificate
                                </button>
                                <button className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-all hover:bg-slate-200">
                                    <Download className="size-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="md:col-span-2 rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                        <FileText className="mx-auto mb-4 size-12 text-slate-300" />
                        <p className="font-medium text-slate-500">
                            No certificates issued yet. Certificates are generated upon landowner approval.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
