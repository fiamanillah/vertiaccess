'use client';

import * as React from 'react';
import { Ticket, PartyProfile } from '@/app/dashboard/components/resolution/types';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
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
    Plane,
    TrendingUp,
    AlertTriangle,
    Ban,
    DollarSign
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import Link from 'next/link';
import { FinancialActionModal } from './modals/financial-action-modal';

interface ContextHubProps {
    ticket: Ticket;
}

const mockReporter: PartyProfile = {
    id: 'op-1',
    name: 'David Chen',
    email: 'david.chen@skyline.com',
    phone: '+44 7700 900123',
    role: 'operator',
    standing: 'good',
    pastBookings: 12,
    disputeCount: 1,
    avatarUrl: ''
};

const mockTarget: PartyProfile = {
    id: 'lo-1',
    name: 'Global Real Estate Group',
    email: 'support@globalrealestate.com',
    phone: '+44 20 7946 0852',
    role: 'landowner',
    standing: 'warned',
    pastBookings: 45,
    disputeCount: 3,
    avatarUrl: ''
};

export function ContextHub({ ticket }: ContextHubProps) {
    const [isFinancialModalOpen, setIsFinancialModalOpen] = React.useState(false);

    return (
        <ScrollArea className="h-full">
            <div className="p-6 space-y-8">
                {/* Section A: Ticket Meta */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Case Management</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-background border shadow-sm space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Current Status</label>
                            <select className="w-full h-10 px-3 rounded-xl border bg-muted/30 font-bold text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                <option value="action_required">Action Required</option>
                                <option value="under_review">Under Review</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Priority Level</label>
                            <div className="flex gap-2">
                                {['low', 'medium', 'high', 'critical'].map(p => (
                                    <button 
                                        key={p}
                                        className={cn(
                                            "flex-1 h-8 rounded-lg border text-[8px] font-black uppercase tracking-tighter transition-all",
                                            ticket.priority === p ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 hover:bg-muted"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <Separator className="bg-border/40" />

                {/* Section B: Booking Context */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Linked Booking Details</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-background border shadow-sm space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Authorization Ref</span>
                                <span className="font-mono text-sm font-black">{ticket.reference}</span>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 gap-2 text-[9px] font-black uppercase tracking-widest">
                                <ExternalLink className="h-3 w-3" /> View
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">TOAL Fee</span>
                                <span className="text-sm font-black">£125.00</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Emergency Landing</span>
                                <span className="text-sm font-black">£150.00</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-dashed">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-tighter text-foreground leading-tight">{ticket.siteName}</span>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">London, E14</span>
                            </div>
                        </div>
                    </div>
                </section>

                <Separator className="bg-border/40" />

                {/* Section C: Parties Involved */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Involved Parties Profiles</span>
                    </div>
                    <div className="space-y-3">
                        <PartyCard profile={mockReporter} label="Reporter (Operator)" />
                        <PartyCard profile={mockTarget} label="Target (Landowner)" />
                    </div>
                </section>

                <Separator className="bg-border/40" />

                {/* Section D: Power Tools */}
                <section className="space-y-4 pb-12">
                    <div className="flex items-center gap-2 text-red-600">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Power Resolution Tools</span>
                    </div>
                    <div className="grid gap-2">
                        <Button 
                            onClick={() => setIsFinancialModalOpen(true)}
                            className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.1em] gap-2 shadow-lg shadow-emerald-100"
                        >
                            <DollarSign className="h-4 w-4" />
                            Process Financial Adjustment
                        </Button>
                        <Button variant="outline" className="h-12 border-2 border-amber-200 text-amber-700 hover:bg-amber-50 font-black text-[10px] uppercase tracking-[0.1em] gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Issue Official Account Warning
                        </Button>
                        <Button variant="outline" className="h-12 border-2 border-red-200 text-red-700 hover:bg-red-50 font-black text-[10px] uppercase tracking-[0.1em] gap-2">
                            <Ban className="h-4 w-4" />
                            Suspend User Account
                        </Button>
                    </div>
                </section>

                <FinancialActionModal 
                    isOpen={isFinancialModalOpen} 
                    onClose={() => setIsFinancialModalOpen(false)} 
                    ticketId={ticket.id}
                    bookingRef={ticket.bookingRef}
                />
            </div>
        </ScrollArea>
    );
}

function PartyCard({ profile, label }: { profile: PartyProfile; label: string }) {
    return (
        <div className="p-4 rounded-2xl bg-background border shadow-sm space-y-4 group hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
                <Badge className={cn(
                    "text-[8px] font-black uppercase tracking-widest h-4 px-1.5 border-none",
                    profile.standing === 'good' ? "bg-emerald-100 text-emerald-700" :
                    profile.standing === 'warned' ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                )}>
                    {profile.standing} standing
                </Badge>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-black text-xs text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {profile.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-black uppercase tracking-tight truncate">{profile.name}</div>
                    <div className="text-[10px] text-muted-foreground font-medium truncate">{profile.email}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-muted-foreground uppercase">Past Bookings</span>
                    <span className="text-xs font-bold">{profile.pastBookings}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-muted-foreground uppercase">Active Disputes</span>
                    <span className="text-xs font-bold text-red-600">{profile.disputeCount}</span>
                </div>
            </div>
        </div>
    );
}
