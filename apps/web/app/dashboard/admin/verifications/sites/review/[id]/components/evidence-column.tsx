'use client';

import * as React from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { DocumentListItem, CheckItem } from './ui-helpers';

interface EvidenceColumnProps {
    site: any;
    onApprove: () => void;
    onReject: () => void;
}

export function EvidenceColumn({ site, onApprove, onReject }: EvidenceColumnProps) {
    return (
        <div className="w-[500px] border-l bg-muted/5 flex flex-col overflow-hidden relative">
            {/* Header for Right Column */}
            <div className="px-6 py-5 border-b bg-background/50 backdrop-blur-sm z-10">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Verification Console
                </h3>
            </div>

            {/* Evidence List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
                {/* 1. Proof of Authority */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Proof of Authority</span>
                        <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] uppercase font-bold tracking-tighter h-5">
                            Declaration Signed
                        </Badge>
                    </div>
                    <div className="space-y-2">
                        {site.ownershipDocuments.map((doc: any, i: number) => (
                            <DocumentListItem key={i} name={doc.name} size={doc.size} type="Ownership Proof" />
                        ))}
                    </div>
                </div>

                <Separator className="bg-border/50" />

                {/* 2. Policy & Operational Documents */}
                <div className="space-y-4">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-1">Policy Documents</span>
                    <div className="space-y-2">
                        {site.policyDocuments.map((doc: any, i: number) => (
                            <DocumentListItem key={i} name={doc.name} size={doc.size} type="Site Policy" />
                        ))}
                    </div>
                    {site.policyDocuments.length === 0 && (
                        <div className="p-6 rounded-xl border border-dashed border-muted-foreground/20 text-center">
                            <p className="text-xs text-muted-foreground italic">No additional documents provided.</p>
                        </div>
                    )}
                </div>

                <Separator className="bg-border/50" />

                {/* Verification Checklist */}
                <div className="space-y-4">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Admin Checklist</span>
                    <div className="space-y-2">
                        <CheckItem label="Boundary coordinates are accurate" />
                        <CheckItem label="Ownership document matches landowner name" />
                        <CheckItem label="Photos confirm site suitability" />
                    </div>
                </div>
            </div>

            {/* 3. The Action Bar (Sticky Footer) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background/80 backdrop-blur-xl z-20">
                <div className="flex gap-3">
                    <Button
                        onClick={onApprove}
                        className="flex-1"
                    >
                        <CheckCircle2 className="h-5 w-5" />
                        Approve Site
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onReject}
                    >
                        <XCircle className="h-5 w-5" />
                        Reject
                    </Button>
                </div>
                <p className="text-[10px] center text-muted-foreground uppercase font-bold tracking-widest mt-3 opacity-60 text-center">
                    Final verification creates a live airspace record
                </p>
            </div>
        </div>
    );
}
