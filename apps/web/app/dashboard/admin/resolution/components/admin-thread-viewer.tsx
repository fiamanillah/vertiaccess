'use client';

import * as React from 'react';
import { Ticket, MessageVisibility, ThreadItem } from '@/app/dashboard/components/resolution/types';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { cn } from '@workspace/ui/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { CaseMessage } from '@/app/dashboard/operator/resolution/components/case-file/case-message';
import { SystemActionLog } from '@/app/dashboard/operator/resolution/components/case-file/system-action-log';
import { AdminComposer } from './admin-composer';
import { 
    MessageSquare, 
    Lock, 
    User, 
    Building2, 
    AlertCircle,
    ArrowDown
} from 'lucide-react';
import { Separator } from '@workspace/ui/components/separator';
import { format } from 'date-fns';

interface AdminThreadViewerProps {
    ticket: Ticket;
}

export function AdminThreadViewer({ ticket }: AdminThreadViewerProps) {
    const [activeChannel, setActiveChannel] = React.useState<MessageVisibility>('reporter');
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Filter items based on channel visibility
    const filteredThread = ticket.thread.filter(item => {
        if (item.type === 'action') return true; // System logs always show
        if (activeChannel === 'internal') return item.visibility === 'internal';
        return item.visibility === activeChannel;
    });

    React.useEffect(() => {
        // Auto-scroll to bottom on channel switch
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [activeChannel]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Channel Toggles */}
            <div className="p-4 border-b bg-muted/10 shrink-0">
                <Tabs value={activeChannel} onValueChange={(v) => setActiveChannel(v as MessageVisibility)}>
                    <TabsList className="bg-background border h-12 p-1.5 gap-1 w-full rounded-2xl shadow-inner">
                        <TabsTrigger 
                            value="reporter" 
                            className="flex-1 gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            <User className="h-3.5 w-3.5" />
                            Thread with Reporter
                        </TabsTrigger>
                        <TabsTrigger 
                            value="target" 
                            className="flex-1 gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all"
                        >
                            <Building2 className="h-3.5 w-3.5" />
                            Thread with Target
                        </TabsTrigger>
                        <TabsTrigger 
                            value="internal" 
                            className="flex-1 gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl data-[state=active]:bg-indigo-700 data-[state=active]:text-white transition-all"
                        >
                            <Lock className="h-3.5 w-3.5" />
                            Internal Notes
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Scrollable Thread View */}
            <ScrollArea className="flex-1" ref={scrollRef}>
                <div className="p-8 space-y-12 max-w-4xl mx-auto">
                    
                    {/* Root Investigation Report */}
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Master Investigation Report</span>
                            </div>
                            <CaseMessage 
                                message={{
                                    id: 'root',
                                    type: 'message',
                                    sender: 'user',
                                    senderName: ticket.operatorName,
                                    content: ticket.description,
                                    timestamp: ticket.createdAt,
                                    attachments: ['evidence_1.png', 'evidence_2.png'],
                                    visibility: 'reporter'
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="h-px w-full bg-border/40" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border">
                            Investigation Timeline Continued
                        </span>
                    </div>

                    {/* Messages & Actions */}
                    <div className="space-y-8 pb-12">
                        {filteredThread.map((item) => {
                            if (item.type === 'message') {
                                return <CaseMessage key={item.id} message={item} showAdminName={true} />;
                            }
                            if (item.type === 'action') {
                                return <SystemActionLog key={item.id} log={item} />;
                            }
                            return null;
                        })}
                    </div>
                </div>
            </ScrollArea>

            {/* Composer */}
            <div className="shrink-0">
                <AdminComposer channel={activeChannel} />
            </div>
        </div>
    );
}
