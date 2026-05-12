'use client';

import { CreditCard as CreditCardIcon, Info, ShieldCheck } from 'lucide-react';
import { Separator as UISeparator } from '@workspace/ui/components/separator';
import { Button } from '@workspace/ui/components/button';
import { OperationType } from './types';

interface StepCheckoutProps {
    operationType: OperationType;
    currentFee: number;
}

export function StepCheckout({ operationType, currentFee }: StepCheckoutProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-5 border border-primary/5 space-y-4 shadow-sm">
                    {operationType === 'toal' ? (
                        <>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Planned TOAL Fee</span>
                                <span className="font-bold">£{currentFee}.00</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Platform Service Fee (5%)</span>
                                <span className="font-bold">£{(currentFee * 0.05).toFixed(2)}</span>
                            </div>
                            <UISeparator className="bg-primary/10" />
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-sm font-black uppercase tracking-widest text-primary">Total Due Today</span>
                                <span className="text-2xl font-black text-primary tracking-tighter">£{(currentFee * 1.05).toFixed(2)}</span>
                            </div>
                            <div className="flex items-start gap-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                                <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                <p className="text-[10px] text-primary/80 font-medium leading-relaxed">
                                    Note: Your card will be charged upon landowner approval.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Standby Reservation Fee</span>
                                <span className="font-bold">£0.00</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-amber-700 font-bold uppercase tracking-wider text-[10px]">Potential Emergency Fee</span>
                                <span className="font-black text-amber-700">£{currentFee}.00</span>
                            </div>
                            <UISeparator className="bg-amber-500/20" />
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-sm font-black uppercase tracking-widest text-foreground">Total Due Today</span>
                                <span className="text-2xl font-black text-foreground tracking-tighter">£0.00</span>
                            </div>
                            <div className="flex items-start gap-2 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                                <ShieldCheck className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-amber-700/80 font-medium leading-relaxed">
                                    Note: You are reserving this site for emergency use. A hold may be placed on your card, but you will only be charged £{currentFee}.00 if you confirm usage after your flight window ends.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-muted/20 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-background p-2 rounded-lg border shadow-sm">
                        <CreditCardIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Card on File</p>
                        <p className="text-xs font-bold tracking-widest">•••• 4242</p>
                    </div>
                </div>
                <Button variant="ghost" size="xs" className="text-[10px] font-black text-primary hover:bg-primary/5 uppercase tracking-widest">CHANGE</Button>
            </div>
        </div>
    );
}
