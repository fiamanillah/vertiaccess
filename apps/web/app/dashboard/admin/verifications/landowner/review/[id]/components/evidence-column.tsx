'use client';

import * as React from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { DocumentListItem, CheckItem } from './ui-helpers';

interface EvidenceColumnProps {
    landowner: any;
    onApprove: () => void;
    onReject: () => void;
}

export function EvidenceColumn({ landowner, onApprove, onReject }: EvidenceColumnProps) {
    return (
        <div className="w-[500px] border-l bg-muted/5 flex flex-col overflow-hidden relative">
            <div className="px-6 py-5 border-b bg-background/50 backdrop-blur-sm z-10">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Verification Console
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
                {/* 1. Legal Evidence */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Identity Evidence</span>
                        <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] uppercase font-bold tracking-tighter h-5">
                            Legally Verified
                        </Badge>
                    </div>
                    <div className="space-y-2">
                        {landowner.submittedDocuments && landowner.submittedDocuments.length > 0 ? (
                            landowner.submittedDocuments.map((doc: any, idx: number) => (
                                <DocumentListItem 
                                    key={idx}
                                    name={doc.name || 'document.pdf'} 
                                    size={doc.size || 'Unknown size'} 
                                    type={doc.type || 'Legal Document'}
                                    url={doc.downloadUrl}
                                />
                            ))
                        ) : (
                            <div className="p-4 rounded-xl border border-dashed text-center">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">No documents attached</p>
                            </div>
                        )}
                    </div>
                </div>

                <Separator className="bg-border/50" />

                {/* 2. Admin Checklist */}
                <div className="space-y-4">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-1">Verification Checklist</span>
                    <div className="space-y-2">
                        <CheckItem label="Business registration is valid and active" />
                        <CheckItem label="Contact details match registry records" />
                        <CheckItem label="Identity document is clear and matches owner" />
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
