'use client';

import * as React from 'react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { Progress } from '@workspace/ui/components/progress';
import { 
    ChevronLeft, 
    Calendar, 
    Clock, 
    CreditCard, 
    Info, 
    Plane, 
    ShieldCheck, 
    Zap,
    Target,
    Ambulance,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

interface BookingEngineCardProps {
    site: {
        toalFee: number;
        emergencyFee: number;
        bookingApprovalModel: string;
    };
}

export function BookingEngineCard({ site }: BookingEngineCardProps) {
    const [step, setStep] = React.useState(1);
    const [operationType, setOperationType] = React.useState<'toal' | 'emergency'>('toal');

    const nextStep = () => setStep((s) => Math.min(s + 1, 4));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const progressValue = (step / 4) * 100;
    const currentFee = operationType === 'toal' ? site.toalFee : site.emergencyFee;

    return (
        <Card className="sticky top-24 shadow-2xl border-primary/10 overflow-hidden bg-background/80 backdrop-blur-md">
            {/* Progress Stepper */}
            <div className="absolute top-0 left-0 right-0 z-20">
                <Progress value={progressValue} className="h-1 rounded-none bg-primary/10" />
            </div>

            <CardHeader className="pb-3 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">
                        Step {step} of 4
                    </span>
                    {step > 1 && (
                        <Button 
                            variant="ghost" 
                            size="xs" 
                            className="h-6 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground"
                            onClick={prevStep}
                        >
                            <ChevronLeft className="mr-1 h-3 w-3" />
                            Back
                        </Button>
                    )}
                </div>
                
                <div className="flex justify-between items-baseline">
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-black tracking-tight">
                            £{currentFee}
                            <span className="text-sm font-medium text-muted-foreground ml-1.5 tracking-normal">/ operation</span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {site.bookingApprovalModel === 'auto' ? (
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 text-[10px] py-0 px-2 font-bold">
                                    <Zap className="h-3 w-3 fill-current" />
                                    AUTO-APPROVAL
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 text-[10px] py-0 px-2 font-bold">
                                    <Clock className="h-3 w-3" />
                                    MANUAL REVIEW
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
                <div className="relative min-h-[240px]">
                    {/* Step 1: Operation Type Selection */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out",
                        step === 1 ? "opacity-100 translate-x-0" : "opacity-0 absolute inset-0 -translate-x-full pointer-events-none"
                    )}>
                        <div className="space-y-4">
                            <p className="text-sm font-bold flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                Select Operation Type
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                <button 
                                    onClick={() => setOperationType('toal')}
                                    className={cn(
                                        "flex flex-col gap-1 p-4 rounded-2xl border-2 text-left transition-all",
                                        operationType === 'toal' 
                                            ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                                            : "border-border bg-background hover:border-primary/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-sm uppercase tracking-wider">Standard TOAL</span>
                                        {operationType === 'toal' && <CheckCircle2 className="h-4 w-4 text-primary fill-current text-background" />}
                                    </div>
                                    <span className="text-xs text-muted-foreground">Normal takeoff and landing operations.</span>
                                </button>
                                <button 
                                    onClick={() => setOperationType('emergency')}
                                    className={cn(
                                        "flex flex-col gap-1 p-4 rounded-2xl border-2 text-left transition-all",
                                        operationType === 'emergency' 
                                            ? "border-amber-500 bg-amber-500/5 ring-4 ring-amber-500/10" 
                                            : "border-border bg-background hover:border-primary/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Ambulance className="h-4 w-4 text-amber-500" />
                                            <span className="font-black text-sm uppercase tracking-wider">Emergency & Recovery</span>
                                        </div>
                                        {operationType === 'emergency' && <CheckCircle2 className="h-4 w-4 text-amber-500 fill-current text-background" />}
                                    </div>
                                    <span className="text-xs text-muted-foreground">Emergency landing or recovery scenarios.</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Schedule */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out",
                        step === 2 ? "opacity-100 translate-x-0" : "opacity-0 absolute inset-0 translate-x-full pointer-events-none"
                    )}>
                        <div className="space-y-4">
                            <p className="text-sm font-bold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                Schedule Flight
                            </p>
                            <div className="p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 space-y-3">
                                <div className="h-32 rounded-xl bg-background/50 border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground text-center px-4">
                                    [Date Picker & Time Dropdowns Placeholder]
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Mission Details */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out",
                        step === 3 ? "opacity-100 translate-x-0" : "opacity-0 absolute inset-0 translate-x-full pointer-events-none"
                    )}>
                        <div className="space-y-4">
                            <p className="text-sm font-bold flex items-center gap-2">
                                <Plane className="h-4 w-4 text-primary" />
                                Flight Mission
                            </p>
                            <div className="p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 space-y-3">
                                <div className="h-32 rounded-xl bg-background/50 border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground text-center px-4">
                                    [Drone Model, Intent, Flyer ID Inputs Placeholder]
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                ALL COMPLIANCE DOCUMENTS VALID
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Checkout */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out",
                        step === 4 ? "opacity-100 translate-x-0" : "opacity-0 absolute inset-0 translate-x-full pointer-events-none"
                    )}>
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
                                <Separator className="bg-primary/10" />
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-base font-bold">Total Amount Due</span>
                                    <span className="text-xl font-black text-primary">£{(currentFee * 1.05).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl border-2 border-border bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-background p-2 rounded-lg border shadow-sm">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Card on File</p>
                                        <p className="text-xs font-bold tracking-widest">•••• 4242</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="xs" className="text-[10px] font-black text-primary hover:bg-primary/5">CHANGE</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-2 pb-6">
                <Button 
                    className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                    onClick={step === 4 ? () => console.log('Booking...') : nextStep}
                >
                    {step === 1 && "Select & Continue"}
                    {step === 2 && "Confirm Schedule"}
                    {step === 3 && "Review & Pay"}
                    {step === 4 && (site.bookingApprovalModel === 'auto' ? "Confirm Booking" : "Submit Request")}
                </Button>
            </CardFooter>
        </Card>
    );
}
