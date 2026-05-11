'use client';

import { CreditCard as CreditCardIcon } from 'lucide-react';
import { Separator as UISeparator } from '@workspace/ui/components/separator';
import { Button } from '@workspace/ui/components/button';
import { OperationType } from './types';

interface StepCheckoutProps {
    operationType: OperationType;
    currentFee: number;
}

export function StepCheckout({ operationType, currentFee }: StepCheckoutProps) {
    return (
        <div className="space-y-5">
            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Site {operationType === 'toal' ? 'TOAL' : 'Emergency'} Fee</span>
                    <span className="font-bold">£{currentFee}.00</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Platform Service Fee (5%)</span>
                    <span className="font-bold">£{(currentFee * 0.05).toFixed(2)}</span>
                </div>
                <UISeparator className="bg-primary/10" />
                <div className="flex justify-between items-center pt-1">
                    <span className="text-base font-bold">Total Amount Due</span>
                    <span className="text-xl font-black text-primary">£{(currentFee * 1.05).toFixed(2)}</span>
                </div>
            </div>

            <div className="p-4 rounded-2xl border-2 border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-background p-2 rounded-lg border shadow-sm">
                        <CreditCardIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Card on File</p>
                        <p className="text-xs font-bold tracking-widest">•••• 4242</p>
                    </div>
                </div>
                <Button variant="ghost" size="xs" className="text-[10px] font-black text-primary hover:bg-primary/5">CHANGE</Button>
            </div>
        </div>
    );
}
