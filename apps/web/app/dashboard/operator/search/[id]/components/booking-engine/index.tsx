'use client';

import * as React from 'react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import {
    AlertCircle,
    ChevronLeft,
    Clock,
    Zap,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
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
import { StepOperationType } from './step-operation-type';
import { StepSchedule } from './step-schedule';
import { StepMissionDetails } from './step-mission-details';
import { StepCheckout } from './step-checkout';
import { MissionData, OperationType } from './types';

interface BookingEngineCardProps {
    site: any;
}

export function BookingEngineCard({ site }: BookingEngineCardProps) {
    const [step, setStep] = React.useState(1);
    const [operationType, setOperationType] = React.useState<OperationType>('toal');
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
    const [selectedStartTime, setSelectedStartTime] = React.useState<string | undefined>(undefined);
    const [selectedEndTime, setSelectedEndTime] = React.useState<string | undefined>(undefined);
    const [missionData, setMissionData] = React.useState<MissionData>({
        droneModel: '',
        weightClass: '',
        missionIntent: '',
        flyerId: '',
        operatorId: '',
    });
    const [showConfirmation, setShowConfirmation] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [bookingId, setBookingId] = React.useState<string | null>(null);

    const nextStep = () => setStep((s) => Math.min(s + 1, 4));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const progressValue = (step / 4) * 100;
    
    const isAuto = site.autoApprove === true;
    const toalFee = site.toalAccessFee || 0;
    const emergencyFee = site.clzAccessFee || 0;
    const currentFee = operationType === 'toal' ? toalFee : emergencyFee;

    const isNextDisabled = () => {
        if (step === 2) return !selectedDate || !selectedStartTime || !selectedEndTime;
        if (step === 3) {
            return !missionData.droneModel ||
                !missionData.weightClass ||
                !missionData.missionIntent ||
                !missionData.flyerId ||
                !missionData.operatorId;
        }
        return false;
    };

    const handleConfirmBooking = async () => {
        setIsLoading(true);
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock booking ID generation
            const mockBookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            setBookingId(mockBookingId);
            setShowConfirmation(true);
        } catch (error) {
            console.error('Booking failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setShowConfirmation(false);
        // Reset the booking engine if needed
        setStep(1);
        setBookingId(null);
    };

    return (
        <Card className="sticky top-24 shadow-2xl border-primary/10 overflow-hidden bg-background/80 backdrop-blur-md max-h-[calc(100vh-8rem)] flex flex-col">
            {/* Progress Stepper */}
            <div className="absolute top-0 left-0 right-0 z-20">
                <Progress value={progressValue} className="h-1 rounded-none bg-primary/10" />
            </div>

            <CardHeader className="pb-3 pt-6 flex-shrink-0">
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

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isAuto ? (
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

                    <div className="bg-muted/40 rounded-xl p-3 border border-primary/5 space-y-2 shadow-inner">
                        <div className="flex justify-between items-center">
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">Standard TOAL</span>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-black tracking-tight text-foreground">£{toalFee}</span>
                                <span className="text-[10px] font-bold text-muted-foreground ml-1">/ op</span>
                            </div>
                        </div>
                        
                        {(site.clzEnabled || site.siteType === 'emergency') && (
                            <div className="pt-2 border-t border-border/50">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">Emergency & Recovery</span>
                                        <div className="text-[8px] text-amber-600 font-bold tracking-tight bg-amber-500/5 px-1 rounded-sm block w-fit">Only if used</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black tracking-tight text-foreground">£{emergencyFee}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground ml-1">/ op</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-2 flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
                <div className="relative min-h-[240px]">
                    {/* Step 1: Operation Type Selection */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out",
                        step === 1 ? "opacity-100 translate-x-0" : "opacity-0 absolute inset-0 -translate-x-full pointer-events-none"
                    )}>
                        <StepOperationType 
                            operationType={operationType} 
                            setOperationType={setOperationType} 
                            site={site}
                        />
                    </div>

                    {/* Step 2: Schedule */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out",
                        step === 2 ? "opacity-100 translate-x-0" : "opacity-0 absolute inset-0 translate-x-full pointer-events-none"
                    )}>
                        <StepSchedule 
                            onSelect={(date, start, end) => {
                                setSelectedDate(date);
                                setSelectedStartTime(start);
                                setSelectedEndTime(end);
                            }} 
                        />
                    </div>

                    {/* Step 3: Mission Details */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out",
                        step === 3 ? "opacity-100 translate-x-0" : "opacity-0 absolute inset-0 translate-x-full pointer-events-none"
                    )}>
                        <StepMissionDetails 
                            missionData={missionData} 
                            setMissionData={setMissionData} 
                        />
                    </div>

                    {/* Step 4: Checkout */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out",
                        step === 4 ? "opacity-100 translate-x-0" : "opacity-0 absolute inset-0 translate-x-full pointer-events-none"
                    )}>
                        <StepCheckout 
                            operationType={operationType} 
                            currentFee={currentFee} 
                        />
                    </div>
                </div>
            </CardContent>

            <CardFooter className="py-4 flex-shrink-0">
                <Button
                    onClick={step === 4 ? handleConfirmBooking : nextStep}
                    disabled={isNextDisabled() || isLoading}
                    className='w-full'
                >
                    {isLoading ? 'Processing...' : (step === 1 && "Select & Continue")}
                    {!isLoading && step === 2 && "Confirm Schedule"}
                    {!isLoading && step === 3 && "Review & Pay"}
                    {!isLoading && step === 4 && (isAuto ? "Confirm Booking" : "Submit Request")}
                </Button>
            </CardFooter>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mx-auto mb-2">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <AlertDialogTitle className="text-center text-lg">
                            Booking Confirmed!
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center space-y-3 pt-2">
                            <p>Your {operationType === 'toal' ? 'TOAL' : 'Emergency'} operation has been successfully booked.</p>
                            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2 text-left">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Booking ID:</span>
                                    <span className="font-mono font-bold text-xs">{bookingId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Amount:</span>
                                    <span className="font-bold">£{(currentFee * 1.05).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className="font-bold text-emerald-600">
                                        {isAuto ? 'Approved' : 'Pending Review'}
                                    </span>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCloseDialog}>Close</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button className="bg-primary hover:bg-primary/90">
                                View Details
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
