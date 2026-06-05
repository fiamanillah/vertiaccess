'use client';

import * as React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { AlertTriangle, Info } from 'lucide-react';
import { Booking } from '../types';
import { differenceInHours } from 'date-fns';

interface CancellationModalProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (booking: Booking) => void;
}

export function CancellationModal({
    booking,
    isOpen,
    onClose,
    onConfirm,
}: CancellationModalProps) {
    if (!booking) return null;

    const hoursUntilFlight = differenceInHours(new Date(booking.startTime), new Date());
    const isLateCancellation = hoursUntilFlight < 24 && booking.status === 'APPROVED';
    const cancellationFee = ((booking.toalCost ?? 0) * 0.5).toFixed(2); // Example 50% fee

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
                <div className={isLateCancellation ? "bg-red-600 h-2" : "bg-amber-500 h-2"} />
                <div className="p-6">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={isLateCancellation ? "bg-red-100 p-2 rounded-full" : "bg-amber-100 p-2 rounded-full"}>
                                {isLateCancellation ? (
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                ) : (
                                    <Info className="h-5 w-5 text-amber-600" />
                                )}
                            </div>
                            <AlertDialogTitle className="text-xl font-black tracking-tight">Confirm Cancellation</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
                            {isLateCancellation ? (
                                <>
                                    Because this flight starts in <span className="text-red-600 font-bold">{hoursUntilFlight} hours</span>, the asset owner's late cancellation policy applies. 
                                    A fee of <span className="text-red-600 font-black">£{cancellationFee}</span> will be charged.
                                </>
                            ) : (
                                "Are you sure you want to cancel this flight? Since you are cancelling more than 24 hours in advance, no cancellation fees will apply."
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3">
                        <AlertDialogCancel>
                            Keep Booking
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            variant={isLateCancellation ? "destructive" : "default"}
                            onClick={() => onConfirm(booking)}
                        >
                            Confirm Cancellation
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
