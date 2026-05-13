'use client';

import * as React from 'react';
import { Ticket } from '@/app/dashboard/components/resolution/types';
import { CaseSidebar } from './case-sidebar';
import { CaseThread } from './case-thread';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import Link from 'next/link';

interface CaseDetailViewProps {
    ticket: Ticket;
    backUrl: string;
}

export function CaseDetailView({ ticket, backUrl }: CaseDetailViewProps) {
    return (
        <div className="flex flex-1 flex-col min-h-screen bg-muted/20">
            {/* Command Header */}
            <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full border bg-background/50">
                            <Link href={backUrl}>
                                <ChevronLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div className="h-10 w-px bg-border/60" />
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Resolution Center</span>
                                <span className="text-muted-foreground/30">/</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{ticket.reference}</span>
                            </div>
                            <h1 className="text-xl font-black tracking-tight uppercase leading-none">
                                {ticket.category.replace(/_/g, ' ')}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Investigation Status</span>
                            <span className="text-sm font-bold text-foreground capitalize">{ticket.status.replace(/_/g, ' ')}</span>
                        </div>
                        <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/10 border transition-all",
                            ticket.status === 'action_required' ? "bg-red-50 border-red-100 text-red-600" : "bg-amber-50 border-amber-100 text-amber-600"
                        )}>
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-12">
                {/* 70/30 Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 md:gap-12 items-start relative">
                    <div className="order-2 lg:order-1 min-w-0">
                        <CaseThread ticket={ticket} />
                    </div>
                    <div className="order-1 lg:order-2 lg:sticky lg:top-32 transition-all">
                        <CaseSidebar ticket={ticket} />
                    </div>
                </div>
            </main>
        </div>
    );
}
