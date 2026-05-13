'use client';

import * as React from 'react';
import { Ticket, ThreadItem } from '@/app/dashboard/components/resolution/types';
import { CaseMessage } from './case-message';
import { SystemActionLog } from './system-action-log';
import { ResolutionEditor } from './resolution-editor';
import { Separator } from '@workspace/ui/components/separator';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { AlertCircle, History } from 'lucide-react';

interface CaseThreadProps {
    ticket: Ticket;
}

export function CaseThread({ ticket }: CaseThreadProps) {
    return (
        <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Thread Header */}
            <div className="flex items-center gap-3 px-1">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <History className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Investigation Timeline</h2>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Full audit log of communication and system actions</p>
                </div>
            </div>

            {/* Original Report (Pinned at Start) */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 px-1 text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Initial Report Submission</span>
                </div>
                <CaseMessage 
                    message={{
                        id: 'original',
                        type: 'message',
                        sender: 'user',
                        senderName: ticket.operatorName,
                        content: ticket.description,
                        timestamp: ticket.createdAt,
                        visibility: 'reporter',
                        attachments: ['evidence_1.png', 'evidence_2.png']
                    }}
                />
            </section>

            <Separator className="bg-border/40" />

            {/* Dynamic Thread Items */}
            <div className="space-y-8">
                {ticket.thread.map((item) => {
                    if (item.type === 'message') {
                        return <CaseMessage key={item.id} message={item} />;
                    }
                    if (item.type === 'action') {
                        return <SystemActionLog key={item.id} log={item} />;
                    }
                    return null;
                })}
            </div>

            <Separator className="bg-border/40" />

            {/* Structured Reply Zone */}
            <section className="space-y-6 pt-4">
                <div className="space-y-1 px-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Submit Official Statement</h3>
                    <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase">
                        Provide professional clarification or additional evidence to support your case. 
                        False statements in an official investigation may result in immediate account termination.
                    </p>
                </div>
                <ResolutionEditor />
            </section>
        </div>
    );
}
