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
    Plane,
    Target,
    Calendar,
    Clock,
    CreditCard,
    MapPin,
    FileText,
    ExternalLink,
    AlertCircle,
    RotateCcw,
} from 'lucide-react';
import { Booking } from '../types';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns';
import { PreviewMap } from '@/components/map/preview-map';

interface BookingDetailDrawerProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
    onCancel: (booking: Booking) => void;
    onResubmit?: (booking: Booking) => void;
}

export function BookingDetailDrawer({
    booking,
    isOpen,
    onClose,
    onCancel,
    onResubmit,
}: BookingDetailDrawerProps) {
    if (!booking) return null;

    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-md flex flex-col p-0 gap-0">

                <SheetHeader className="p-4 border-b bg-muted/5">
                    <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0 border-primary/20 text-primary bg-primary/5">
                            {booking.bookingReference}
                        </Badge>
                        <Badge
                            className={cn(
                                "text-[8px] uppercase tracking-widest border-none font-bold h-4 px-1.5",
                                booking.status === 'PENDING' ? "bg-amber-100 text-amber-700" :
                                    booking.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700" :
                                        booking.status === 'REJECTED' ? "bg-red-100 text-red-700" :
                                            "bg-muted text-muted-foreground"
                            )}
                        >
                            {booking.status}
                        </Badge>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <div className="text-xl font-black tracking-tighter text-foreground uppercase">
                            {format(startTime, 'dd MMM yyyy')}
                        </div>
                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Real Map View with validation */}
                    {booking.latitude !== undefined && booking.longitude !== undefined ? (
                        <PreviewMap
                            center={{ lat: booking.latitude, lng: booking.longitude }}
                            toalRadius={booking.toalRadius}
                            emergencyRadius={booking.emergencyRadius}
                            showEmergency={booking.showEmergency}
                            toalMode={booking.toalMode}
                            emergencyMode={booking.emergencyMode}
                            initialToalPolygonPoints={booking.toalPolygonPoints}
                            initialEmergencyPolygonPoints={booking.emergencyPolygonPoints}
                            className="w-full h-48! overflow-hidden border-b border-border/50 p-1"
                        />
                    ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center border-b">
                            <div className="text-center space-y-1">
                                <MapPin className="h-6 w-6 text-muted-foreground mx-auto opacity-50" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Coordinates Unavailable</p>
                            </div>
                        </div>
                    )}

                    <div className="p-6 space-y-8">
                        {/* Rejection Feedback */}
                        {booking.status === 'REJECTED' && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2 text-red-700">
                                    <AlertCircle className="h-4 w-4" />
                                    <h4 className="text-xs font-black uppercase tracking-widest">Reason for Rejection</h4>
                                </div>
                                <p className="text-sm font-medium text-red-900/80 italic leading-relaxed">
                                    "{booking.adminNote || 'No specific reason provided.'}"
                                </p>
                                <Button
                                    className="w-full shadow-sm"
                                    variant="destructive"
                                    onClick={() => onResubmit?.(booking)}
                                >
                                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                    Edit & Resubmit Request
                                </Button>
                            </div>
                        )}

                        {/* Location Details */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-primary">
                                <MapPin className="h-4 w-4" />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Location Details</h3>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                                <div className="font-bold text-base mb-1 tracking-tight">{booking.siteName}</div>
                                <div className="text-sm text-muted-foreground leading-snug mb-4">{booking.siteAddress}</div>
                                <Button variant="outline" className="w-full shadow-sm" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.siteAddress)}`, '_blank')}>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Open in Google Maps
                                </Button>
                            </div>
                        </section>

                        {/* Mission Profile */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Plane className="h-4 w-4" />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Mission Profile</h3>
                            </div>
                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Drone Model</div>
                                        <div className="text-sm font-black text-foreground tracking-tight">{booking.droneModel}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Flyer ID</div>
                                        <div className="text-sm font-mono font-bold">{booking.flyerId}</div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText className="h-3 w-3" /> Mission Intent
                                    </div>
                                    <p className="text-base font-bold leading-tight text-foreground bg-muted/20 p-4 rounded-xl border border-border/40 italic shadow-sm">
                                        "{booking.missionIntent}"
                                    </p>
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
                                        {booking.useCategory === 'emergency_recovery' ? 'Potential Emergency Fee' : 'Total Cost (Paid)'}
                                    </div>
                                    <div className={cn(
                                        "text-3xl font-black tracking-tight",
                                        booking.useCategory === 'emergency_recovery' ? "text-amber-900" : "text-emerald-900"
                                    )}>
                                        £{booking.toalCost?.toFixed(2)}
                                    </div>
                                    <p className="text-[10px] font-medium opacity-70 mt-1">
                                        via Card ending in {booking.paymentMethodLast4}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Badge className={cn(
                                        "border-none font-bold text-[10px]",
                                        booking.useCategory === 'emergency_recovery' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                    )}>
                                        {booking.useCategory === 'emergency_recovery' ? 'STANDBY' : 'PAID'}
                                    </Badge>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <SheetFooter className="p-4 border-t bg-muted/10">
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full shadow-sm text-[10px] font-black uppercase tracking-widest h-9"
                        onClick={() => onCancel(booking)}
                        disabled={booking.status === 'CANCELLED' || booking.status === 'REJECTED' || booking.status === 'EXPIRED'}
                    >
                        Cancel Booking
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
