'use client';

import * as React from 'react';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Booking } from '../types';

interface EmergencyBannerProps {
    booking: Booking;
    onResolve: (booking: Booking, used: boolean) => void;
}

export function EmergencyBanner({ booking, onResolve }: EmergencyBannerProps) {
    return (
        <div className="bg-amber-600 text-white p-4 sm:px-6 rounded-2xl shadow-lg shadow-amber-600/20 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                    <h3 className="text-sm font-black uppercase tracking-widest leading-none">Emergency Usage Confirmation</h3>
                    <p className="text-xs font-medium text-white/90">
                        Your flight window for <span className="font-bold underline decoration-white/30 underline-offset-2">{booking.siteName}</span> has closed. Did you utilize this site?
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
                <Button 
                    className="flex-1 md:flex-none bg-white text-amber-700 hover:bg-white/90 font-black text-[10px] uppercase tracking-widest h-10 px-6 shadow-sm"
                    onClick={() => onResolve(booking, true)}
                >
                    Yes, I landed here
                </Button>
                <Button 
                    variant="ghost" 
                    className="flex-1 md:flex-none text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest h-10 px-6 border border-white/20"
                    onClick={() => onResolve(booking, false)}
                >
                    No, flight was nominal
                </Button>
            </div>
        </div>
    );
}
