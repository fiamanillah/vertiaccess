'use client';

import * as React from 'react';
import { Ticket } from '@/app/dashboard/components/resolution/types';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { cn } from '@workspace/ui/lib/utils';
import { AdminThreadViewer } from './admin-thread-viewer';
import { ContextHub } from './context-hub';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, Scale, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface TriPaneLayoutProps {
    activeTicket: Ticket;
}

export function TriPaneLayout({ activeTicket }: TriPaneLayoutProps) {
    return (
        <div className="flex flex-col h-screen bg-muted/30 overflow-hidden">
            {/* Minimal Command Bar */}
            <header className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href="/dashboard/admin/resolution">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                            <Scale className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Command Center</span>
                            <span className="text-sm font-black tracking-tight uppercase leading-tight">Admin Resolution Desk</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Audit Mode Active</span>
                    </div>
                </div>
            </header>

            {/* Dual-Pane Grid */}
            <div className="flex flex-1 overflow-hidden">
                {/* Pane 1: Investigation Workspace (70%) */}
                <main className="w-[70%] flex flex-col bg-background overflow-hidden border-r shadow-2xl relative z-10">
                    <AdminThreadViewer ticket={activeTicket} />
                </main>

                {/* Pane 2: Context & Action Hub (30%) */}
                <aside className="flex-1 bg-muted/5 hidden lg:flex flex-col overflow-hidden">
                    <ContextHub ticket={activeTicket} />
                </aside>
            </div>
        </div>
    );
}
