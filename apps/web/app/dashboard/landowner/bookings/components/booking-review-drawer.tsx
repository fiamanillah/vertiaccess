'use client';

import * as React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@workspace/ui/components/sheet';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import {
    User,
    Building2,
    Plane,
    Target,
    Calendar,
    Clock,
    CreditCard,
    ShieldCheck,
    AlertTriangle,
    MapPin,
    FileText,
} from 'lucide-react';
import { Booking } from '../types';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns';

interface BookingReviewDrawerProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export function BookingReviewDrawer({
    booking,
    isOpen,
    onClose,
    onApprove,
    onReject,
}: BookingReviewDrawerProps) {
    if (!booking) return null;

    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-md flex flex-col p-0 gap-0">
                <SheetHeader className="p-6 pb-4 border-b">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between mb-4">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 border-primary/20 text-primary bg-primary/5">
                                {booking.bookingReference}
                            </Badge>
                            <Badge
                                className={cn(
                                    "text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2",
                                    booking.status === 'PENDING' ? "bg-amber-100 text-amber-700" :
                                        booking.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700" :
                                            "bg-red-100 text-red-700"
                                )}
                            >
                                {booking.status}
                            </Badge>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-3xl font-black tracking-tighter text-foreground uppercase">
                                {format(startTime, 'dd MMMM yyyy')}
                            </div>
                            <div className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">
                        {/* Site Info */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-primary">
                                <MapPin className="h-4 w-4" />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Target Location</h3>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                                <div className="font-bold text-base mb-1">{booking.siteName}</div>
                                <div className="text-sm text-muted-foreground">{booking.siteAddress}</div>
                                <div className="mt-3 flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border-none">
                                        {booking.siteType?.toUpperCase()}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px] font-bold bg-muted/80 border-none">
                                        {booking.siteCategory}
                                    </Badge>
                                </div>
                            </div>
                        </section>

                        {/* Operator Identity */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <User className="h-4 w-4" />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Operator Identity</h3>
                            </div>
                            <div className="grid gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {booking.operatorName?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground">{booking.operatorName}</div>
                                        <div className="text-xs text-muted-foreground">{booking.operatorEmail}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Building2 className="h-3 w-3" /> Organisation
                                        </div>
                                        <div className="text-sm font-medium">{booking.operatorOrganisation || 'Independent'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <ShieldCheck className="h-3 w-3" /> CAA Flyer ID
                                        </div>
                                        <div className="text-sm font-mono">{booking.operatorFlyerId || 'PENDING'}</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Mission Profile */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Plane className="h-4 w-4" />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Mission Profile</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Plane className="h-3 w-3" /> Drone Model
                                        </div>
                                        <div className="text-lg font-black text-foreground tracking-tight">{booking.droneModel}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Target className="h-3 w-3" /> Access Tier
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "capitalize text-[10px] font-black border-none h-5 px-2 uppercase tracking-widest",
                                            booking.useCategory === 'planned_toal' ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
                                        )}>
                                            {booking.useCategory.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText className="h-3 w-3" /> Mission Intent
                                    </div>
                                    <p className="text-lg font-bold leading-tight text-foreground bg-muted/20 p-5 rounded-2xl border border-border/40 italic shadow-inner">
                                        "{booking.missionIntent}"
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" /> Date
                                        </div>
                                        <div className="text-sm font-medium">{format(startTime, 'PPP')}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" /> Window
                                        </div>
                                        <div className="text-sm font-medium">
                                            {format(startTime, 'p')} - {format(endTime, 'p')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Financial Snapshot */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-primary">
                                <CreditCard className="h-4 w-4" />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Financial Summary</h3>
                            </div>
                            <div className={cn(
                                "rounded-xl p-5 flex items-center justify-between border shadow-sm",
                                booking.useCategory === 'emergency_recovery' ? "bg-amber-50/50 border-amber-100" : "bg-emerald-50/30 border-emerald-100"
                            )}>
                                <div className="space-y-0.5">
                                    <div className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider",
                                        booking.useCategory === 'emergency_recovery' ? "text-amber-700" : "text-emerald-700"
                                    )}>
                                        {booking.useCategory === 'emergency_recovery' ? 'Emergency Standby Fee' : 'Access Fee (Gross)'}
                                    </div>
                                    <div className={cn(
                                        "text-3xl font-black tracking-tight",
                                        booking.useCategory === 'emergency_recovery' ? "text-amber-900" : "text-emerald-900"
                                    )}>
                                        £{booking.toalCost?.toFixed(2)}
                                    </div>
                                    {booking.useCategory === 'emergency_recovery' && (
                                        <p className="text-[9px] font-bold text-amber-600 mt-1 italic uppercase tracking-tighter">
                                            Only paid if site is used
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <Badge className={cn(
                                        "border-none font-bold text-[10px]",
                                        booking.useCategory === 'emergency_recovery' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                    )}>
                                        {booking.useCategory === 'emergency_recovery' ? 'POTENTIAL' : 'PAID (ESCROW)'}
                                    </Badge>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <SheetFooter className="p-6 border-t bg-muted/10">
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-black text-[11px] uppercase tracking-widest h-12 shadow-sm"
                            onClick={() => onReject(booking.id)}
                            disabled={booking.status !== 'PENDING'}
                        >
                            Decline
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-widest h-12 shadow-lg shadow-emerald-600/20"
                            onClick={() => onApprove(booking.id)}
                            disabled={booking.status !== 'PENDING'}
                        >
                            Approve Access
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
