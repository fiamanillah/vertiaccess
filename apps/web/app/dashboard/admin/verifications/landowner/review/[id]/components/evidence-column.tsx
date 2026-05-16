'use client';

import * as React from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { DocumentListItem } from './ui-helpers';

interface EvidenceColumnProps {
    verification: any;
    onApprove: () => void;
    onReject: () => void;
}

export function EvidenceColumn({ verification, onApprove, onReject }: EvidenceColumnProps) {
    const documents = verification?.submittedDocuments || [];

    return (
        <div className="w-[500px] border-l bg-muted/5 flex flex-col overflow-hidden relative">
            <div className="px-6 py-5 border-b bg-background/50 backdrop-blur-sm z-10">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Verification Console
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
                {/* 1. Submitted Documents */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Submitted Evidence</span>
                    </div>
                    <div className="space-y-2">
                        {documents.length > 0 ? (
                            documents.map((doc: any, index: number) => (
                                <DocumentListItem 
                                    key={index}
                                    name={doc.fileName || doc.fileKey?.split('/').pop() || `Document ${index + 1}`}
                                    type={doc.documentType?.replace(/_/g, ' ') || 'Identity Document'}
                                    url={doc.downloadUrl}
                                />
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground italic px-1">No documents submitted.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background/80 backdrop-blur-xl z-20">
                <div className="flex gap-3">
                    <Button
                        onClick={onApprove}
                        className="flex-1 h-12 font-bold gap-2"
                    >
                        <CheckCircle2 className="h-5 w-5" />
                        Approve Landowner
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onReject}
                        className="h-12 px-6 font-bold gap-2"
                    >
                        <XCircle className="h-5 w-5" />
                        Reject
                    </Button>
                </div>
                <p className="text-[10px] center text-muted-foreground uppercase font-bold tracking-widest mt-3 opacity-60 text-center">
                    Verification grants full property management rights
                </p>
            </div>
        </div>
    );
}
