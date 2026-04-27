import { useState } from 'react';
import type { Site } from '../../types';
import { Download, FileText, Upload, X } from 'lucide-react';
import { motion } from 'motion/react';

interface Step2PolicyEvidenceProps {
    site: Site;
    // Lifted state from parent
    policyAcknowledged: boolean;
    onPolicyAcknowledgedChange: (v: boolean) => void;
    attachedFiles: { name: string; size: string }[];
    onAttachedFilesChange: (files: { name: string; size: string }[]) => void;
    onStepChange: (step: 1 | 3) => void;
}

export function Step2PolicyEvidence({
    site,
    policyAcknowledged,
    onPolicyAcknowledgedChange,
    attachedFiles,
    onAttachedFilesChange,
    onStepChange,
}: Step2PolicyEvidenceProps) {
    // Only isDragging is purely local UI state
    const [isDragging, setIsDragging] = useState(false);

    const isStep2Valid = policyAcknowledged;

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        Array.from(files).forEach(file => {
            if (!validTypes.includes(file.type)) {
                alert(`Invalid file type: ${file.name}. Only PDF and image files are allowed.`);
                return;
            }

            if (file.size > maxSize) {
                alert(`File too large: ${file.name}. Maximum size is 10MB.`);
                return;
            }

            const newFile = {
                name: file.name,
                size: formatFileSize(file.size),
            };

            onAttachedFilesChange([...attachedFiles, newFile]);
        });

        // Reset the input
        if (event.target) {
            event.target.value = '';
        }
    };

    const triggerFileInput = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.pdf,.jpg,.jpeg,.png,.webp';
        input.onchange = handleFileUpload as any;
        input.click();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (!files) return;

        // Convert FileList to array and process
        const fileArray = Array.from(files);
        const mockEvent = {
            target: { files: fileArray as any },
        } as React.ChangeEvent<HTMLInputElement>;

        handleFileUpload(mockEvent);
    };

    const removeFile = (index: number) => {
        onAttachedFilesChange(attachedFiles.filter((_, i) => i !== index));
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
        >
            <div className="space-y-8">
                <div className="p-6 sm:p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-[0.15em] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        Site-Specific Directives
                        <button className="text-xs text-blue-600 font-bold flex items-center gap-1.5 hover:underline">
                            <Download className="size-3.5" />
                            Download Policy
                        </button>
                    </h5>
                    <div className="space-y-4">
                        <p className="text-base text-slate-600 leading-relaxed italic border-l-4 border-blue-600 pl-6 font-medium">
                            "
                            {site.siteInformation ||
                                'Standard safety directives apply. No hazardous materials transport permitted without prior clearance.'}
                            "
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <h5 className="text-sm font-bold text-slate-800">
                            Required Compliance Evidence
                        </h5>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            PDF / HIGH-RES IMAGE
                        </span>
                    </div>
                    <div
                        onClick={triggerFileInput}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-[28px] p-6 sm:p-12 lg:p-16 bg-slate-50/50 flex flex-col items-center gap-5 transition-all cursor-pointer group ${
                            isDragging
                                ? 'border-blue-600 bg-blue-50/40'
                                : 'border-slate-300 hover:border-blue-600 hover:bg-blue-50/20'
                        }`}
                    >
                        <div className="size-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                            <Upload className="size-8" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg sm:text-xl font-black text-slate-800">
                                {isDragging ? 'Drop files here' : 'Attach Compliance Evidence'}
                            </p>
                            <p className="text-sm text-slate-500 mt-1 font-medium italic">
                                Risk Assessment, Insurance, or OSC documents
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                                PDF, JPG, PNG, WebP (Max 10MB per file)
                            </p>
                            {!isDragging && (
                                <p className="text-xs text-blue-600 mt-3 font-medium">
                                    Click to browse or drag and drop
                                </p>
                            )}
                        </div>
                    </div>

                    {attachedFiles.length > 0 && (
                        <div className="space-y-3">
                            {attachedFiles.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                            <FileText className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {file.size}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            removeFile(idx);
                                        }}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <label className="flex items-start gap-4 sm:gap-5 p-5 sm:p-8 bg-blue-50/50 border border-blue-100 rounded-[28px] cursor-pointer group hover:bg-blue-50 transition-colors">
                    <input
                        type="checkbox"
                        checked={policyAcknowledged}
                        onChange={e => onPolicyAcknowledgedChange(e.target.checked)}
                        className="mt-1 size-6 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600 transition-all"
                    />
                    <p className="text-sm text-slate-800 font-bold leading-relaxed">
                        I confirm that all provided evidence is accurate and acknowledge my
                        obligation to comply with the landowner's site safety directives at all
                        times.
                    </p>
                </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-50">
                <button
                    onClick={() => onStepChange(1)}
                    className="h-14 sm:h-16 px-10 border border-slate-200 text-slate-800 rounded-3xl font-bold hover:bg-slate-50 transition-all w-full sm:w-auto"
                >
                    Previous
                </button>
                <button
                    onClick={() => onStepChange(3)}
                    disabled={!isStep2Valid}
                    className="flex-1 h-14 sm:h-16 bg-blue-600 text-white rounded-3xl font-black text-sm sm:text-base hover:bg-blue-700 transition-all disabled:opacity-30 shadow-xl shadow-blue-500/10 w-full"
                >
                    Continue to Final Review
                </button>
            </div>
        </motion.div>
    );
}
