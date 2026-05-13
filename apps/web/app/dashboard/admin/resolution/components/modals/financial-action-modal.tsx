'use client';

import * as React from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Label } from '@workspace/ui/components/label';
import { 
    DollarSign, 
    ShieldCheck, 
    AlertTriangle,
    CreditCard
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';

interface FinancialActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId: string;
    bookingRef: string;
}

export function FinancialActionModal({ isOpen, onClose, ticketId, bookingRef }: FinancialActionModalProps) {
    const [action, setAction] = React.useState<'refund' | 'charge' | 'partial'>('refund');
    const [amount, setAmount] = React.useState('150.00');
    const [reason, setReason] = React.useState('');
    const [isExecuting, setIsExecuting] = React.useState(false);

    const handleExecute = () => {
        if (!reason.trim()) return;
        setIsExecuting(true);
        setTimeout(() => {
            toast.success(`Financial action executed: £${amount} ${action} processed`);
            setIsExecuting(false);
            onClose();
        }, 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-emerald-600 p-6 text-white">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Audit-Locked Action</span>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight">Process Financial Adjustment</DialogTitle>
                            </div>
                        </div>
                        <DialogDescription className="text-emerald-50/70 text-xs font-medium leading-relaxed">
                            Executing a financial adjustment will move funds between parties or issue a refund via the Stripe vault. This action is final and will be logged in the public investigation timeline.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Action Selector */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'refund', label: 'Issue Full Refund', icon: CreditCard },
                            { id: 'partial', label: 'Partial Refund', icon: DollarSign },
                            { id: 'charge', label: 'Force Charge', icon: AlertTriangle }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setAction(item.id as any)}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                                    action === item.id 
                                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" 
                                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                <span className="text-[8px] font-black uppercase tracking-tighter text-center leading-tight">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Adjustment Amount (£)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-11 h-12 bg-muted/30 border-none font-black text-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Mandatory Audit Reason</Label>
                            <Textarea 
                                placeholder="Explain the legal/financial justification for this adjustment (e.g., CCTV evidence confirmed unauthorized landing)..."
                                className="min-h-[100px] bg-muted/30 border-none resize-none p-4 font-medium text-sm leading-relaxed"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                        <p className="text-[10px] font-bold text-amber-800 leading-tight">
                            WARNING: Forcing a charge on an operator without solid evidence may result in legal escalation or payment disputes.
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/30 border-t gap-3">
                    <Button variant="ghost" onClick={onClose} className="h-12 font-black text-[10px] uppercase tracking-widest flex-1">
                        Cancel Action
                    </Button>
                    <Button 
                        onClick={handleExecute}
                        disabled={!reason.trim() || isExecuting}
                        className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.1em] gap-2 flex-1 shadow-lg shadow-emerald-100"
                    >
                        {isExecuting ? 'Executing...' : (
                            <>
                                <ShieldCheck className="h-4 w-4" />
                                Execute Adjustment
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
