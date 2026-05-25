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
    ShieldAlert,
} from 'lucide-react';
import { Booking } from '../types';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns';
import { PreviewMap } from '@/components/map/preview-map';
import { ReportModal } from '@/components/reporting/report-modal';

interface BookingDetailDrawerProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
    onCancel: (booking: Booking) => void;
    onResubmit?: (booking: Booking) => void;
}

function getStatusBadgeConfig(status: string) {
    switch (status.toUpperCase()) {
        case 'APPROVED':
            return {
                label: 'Approved',
                className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                dot: 'bg-emerald-500 animate-pulse',
            };
        case 'PENDING':
            return {
                label: 'Pending',
                className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
                dot: 'bg-amber-500 animate-pulse',
            };
        case 'REJECTED':
            return {
                label: 'Rejected',
                className: 'bg-destructive/10 text-destructive border border-destructive/20',
                dot: 'bg-destructive',
            };
        case 'CANCELLED':
            return {
                label: 'Cancelled',
                className: 'bg-muted text-muted-foreground border border-border',
                dot: 'bg-muted-foreground',
            };
        case 'EXPIRED':
            return {
                label: 'Expired',
                className: 'bg-muted text-muted-foreground border border-border',
                dot: 'bg-muted-foreground',
            };
        default:
            return {
                label: status,
                className: 'bg-primary/10 text-primary border border-primary/20',
                dot: 'bg-primary',
            };
    }
}

export function BookingDetailDrawer({
    booking,
    isOpen,
    onClose,
    onCancel,
    onResubmit,
}: BookingDetailDrawerProps) {
    const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);

    if (!booking) return null;

    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const statusConfig = getStatusBadgeConfig(booking.status);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-md flex flex-col p-0 gap-0 border-l border-border/80 shadow-2xl bg-background">
                <SheetHeader className="p-4 border-b bg-muted/20 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 border-primary/20 text-primary bg-primary/5">
                            {booking.bookingReference}
                        </Badge>
                        <Badge
                            className={cn(
                                "text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 border flex items-center gap-1.5 shadow-none",
                                statusConfig.className
                            )}
                        >
                            <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
                            {statusConfig.label}
                        </Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                        <SheetTitle className="text-lg font-bold tracking-tight text-foreground uppercase">
                            {format(startTime, 'dd MMM yyyy')}
                        </SheetTitle>
                        <SheetDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Map preview — derive coordinates from siteGeometry */}
                    {(() => {
                        const geo = booking.siteGeometry as any;
                        const center = geo?.center ?? geo?.geometry?.center ?? null;
                        if (center?.lat && center?.lng) {
                            return (
                                <PreviewMap
                                    center={{ lat: center.lat, lng: center.lng }}
                                    toalRadius={geo?.radius ?? 150}
                                    emergencyRadius={(booking.siteClzGeometry as any)?.radius ?? 300}
                                    showEmergency={!!booking.siteClzGeometry}
                                    toalMode={geo?.type === 'polygon' ? 'polygon' : 'circle'}
                                    emergencyMode={'circle'}
                                    className="w-full h-44 overflow-hidden border-b border-border/50"
                                />
                            );
                        }
                        return (
                            <div className="w-full h-44 bg-muted/30 flex items-center justify-center border-b border-border/50">
                                <div className="text-center space-y-1">
                                    <MapPin className="h-6 w-6 text-muted-foreground mx-auto opacity-50" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Coordinates Unavailable</p>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="p-4 space-y-4">
                        {/* Rejection Feedback */}
                        {booking.status === 'REJECTED' && (
                            <div className="bg-destructive/5 border border-destructive/15 rounded-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider">Reason for Rejection</h4>
                                </div>
                                <p className="text-sm font-medium text-destructive/90 italic leading-relaxed bg-background/50 p-2.5 rounded-lg border border-destructive/10">
                                    "{booking.adminNote || 'No specific reason provided.'}"
                                </p>
                                <Button
                                    className="w-full shadow-sm text-xs h-9"
                                    variant="destructive"
                                    onClick={() => onResubmit?.(booking)}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Edit & Resubmit Request
                                </Button>
                            </div>
                        )}

                        {/* Location Details */}
                        <section className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                                    <MapPin className="h-3.5 w-3.5" />
                                </div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location Details</h3>
                            </div>
                            <div className="bg-card/40 rounded-xl p-3 border border-border/60 backdrop-blur-sm shadow-sm space-y-3">
                                <div>
                                    <div className="font-bold text-sm tracking-tight text-foreground">{booking.siteName}</div>
                                    <div className="text-xs text-muted-foreground leading-relaxed mt-0.5">{booking.siteAddress}</div>
                                </div>
                                <Button 
                                    variant="outline" 
                                    className="w-full text-xs font-semibold h-8" 
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.siteAddress ?? booking.siteName ?? '')}`, '_blank')}
                                >
                                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                    Open in Google Maps
                                </Button>
                            </div>
                        </section>

                        {/* Mission Profile */}
                        <section className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                                    <Plane className="h-3.5 w-3.5" />
                                </div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mission Profile</h3>
                            </div>
                            <div className="bg-card/40 rounded-xl p-3 border border-border/60 backdrop-blur-sm shadow-sm space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-0.5">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Drone Model</div>
                                        <div className="text-sm font-semibold text-foreground tracking-tight">{booking.droneModel || 'N/A'}</div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Flyer ID</div>
                                        <div className="text-sm font-mono font-medium text-foreground bg-muted/80 px-2 py-0.5 rounded w-fit border border-border/40">{booking.flyerId || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="space-y-1.5 pt-2 border-t border-border/40">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground/60" /> Mission Intent
                                    </div>
                                    <p className="text-xs leading-relaxed text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40 italic">
                                        "{booking.missionIntent || 'No mission details provided.'}"
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Financial Snapshot */}
                        <section className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                                    <CreditCard className="h-3.5 w-3.5" />
                                </div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial Summary</h3>
                            </div>
                            <div className={cn(
                                "rounded-xl p-4 flex items-center justify-between border shadow-sm",
                                booking.useCategory === 'emergency_recovery' 
                                    ? "bg-amber-500/5 border-amber-500/20" 
                                    : "bg-primary/5 border-primary/20"
                            )}>
                                <div className="space-y-0.5">
                                    <div className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider",
                                        booking.useCategory === 'emergency_recovery' ? "text-amber-600 dark:text-amber-400" : "text-primary"
                                    )}>
                                        {booking.useCategory === 'emergency_recovery' ? 'Potential Emergency Fee' : 'Total Cost (Paid)'}
                                    </div>
                                    <div className={cn(
                                        "text-2xl font-black tracking-tight",
                                        booking.useCategory === 'emergency_recovery' ? "text-amber-700 dark:text-amber-500" : "text-foreground"
                                    )}>
                                        £{(booking.toalCost ?? 0).toFixed(2)}
                                    </div>
                                    <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                                        via Card ending in {booking.paymentMethodLast4 || 'XXXX'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Badge className={cn(
                                        "border border-none font-bold text-[10px]",
                                        booking.useCategory === 'emergency_recovery' 
                                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                                            : "bg-primary/10 text-primary"
                                    )}>
                                        {booking.useCategory === 'emergency_recovery' ? 'STANDBY' : 'PAID'}
                                    </Badge>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <SheetFooter className="p-4 border-t bg-muted/10 flex flex-col gap-3">
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full text-xs font-bold uppercase tracking-wider h-10 shadow-sm"
                        onClick={() => onCancel(booking)}
                        disabled={booking.status === 'CANCELLED' || booking.status === 'REJECTED' || booking.status === 'EXPIRED'}
                    >
                        Cancel Booking
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-[10px] font-semibold uppercase tracking-wider h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 border border-transparent gap-2"
                        onClick={() => setIsReportModalOpen(true)}
                    >
                        <ShieldAlert className="h-4 w-4" />
                        Report an Issue
                    </Button>
                </SheetFooter>
            </SheetContent>

            <ReportModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                bookingId={booking.id}
                bookingReference={booking.bookingReference}
                siteId={booking.siteId}
                role="operator"
                redirectBaseUrl="/dashboard/operator/incident-report"
            />
        </Sheet>
    );
}
