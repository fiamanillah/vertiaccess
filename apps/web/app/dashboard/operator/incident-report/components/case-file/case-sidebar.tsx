'use client';

import * as React from 'react';
import { Ticket } from '@/app/dashboard/components/incident-report/types';
import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import {
    Info,
    ExternalLink,
    MapPin,
    User,
    CreditCard,
    ShieldAlert,
    Building2,
    Calendar,
    Plane
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import Link from 'next/link';

interface CaseSidebarProps {
    ticket: Ticket;
}

export function CaseSidebar({ ticket }: CaseSidebarProps) {
    return (
        <aside className="space-y-6">
            <Card className="border-none shadow-xl bg-background/50 backdrop-blur-xl overflow-hidden">
                <div className={cn(
                    "h-1.5 w-full",
                    ticket.status === 'action_required' ? "bg-red-600" : "bg-amber-500"
                )} />
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Case Metadata</span>
                        <Badge className={cn(
                            "text-[9px] font-black uppercase tracking-widest border-none h-5 px-2",
                            ticket.status === 'action_required' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        )}>
                            {ticket.status.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tighter uppercase">{ticket.reference}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Separator className="bg-border/40" />

                    {/* Disputed Amount */}
                    {ticket.disputedAmount && (
                        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50">
                            <div className="text-[10px] font-black uppercase tracking-widest text-red-700/70 mb-1">Disputed Amount</div>
                            <div className="text-2xl font-black text-red-900">£{ticket.disputedAmount.toFixed(2)}</div>
                        </div>
                    )}

                    {/* Booking Reference */}
                    <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Info className="h-3 w-3" /> Linked Authorization
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                            <span className="font-mono text-sm font-bold">{ticket.bookingRef}</span>
                            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                                View <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                        </div>
                    </div>

                    {/* Site Details */}
                    <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-3 w-3" /> Site Location
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                            <div className="font-bold text-sm mb-1">{ticket.siteName}</div>
                            <Link href={`#`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                                Open Site Profile <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                        </div>
                    </div>

                    {/* Involved Parties */}
                    <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <User className="h-3 w-3" /> Parties Involved
                        </div>
                        <div className="grid gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Plane className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <div className="text-xs font-black uppercase tracking-tight">Operator</div>
                                    <div className="text-sm font-bold text-foreground/80">{ticket.operatorName}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-amber-700" />
                                </div>
                                <div>
                                    <div className="text-xs font-black uppercase tracking-tight">Landowner</div>
                                    <div className="text-sm font-bold text-foreground/80">{ticket.landownerName}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border/40" />

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-700">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <p className="text-[10px] font-bold leading-tight">
                            This investigation is mediated by the VertiAccess Safety Team. All decisions are final.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </aside>
    );
}
