'use client';

import * as React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { DocumentListItem } from './ui-helpers';

interface EvidenceColumnProps {
    verification: any;
}

export function EvidenceColumn({ verification }: EvidenceColumnProps) {
    const documents = verification?.submittedDocuments || [];

    return (
        <div className="bg-background border rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b bg-muted/30">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Submitted Evidence
                </h3>
            </div>

            <div className="p-4 md:p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Files</span>
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
                            <p className="text-sm text-muted-foreground italic px-1">No documents submitted for this request.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
