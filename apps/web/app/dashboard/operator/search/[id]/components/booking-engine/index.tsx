'use client';

import * as React from 'react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import {
    ChevronLeft,
    Clock,
    Zap,
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { StepOperationType } from './step-operation-type';
import { StepSchedule } from './step-schedule';
import { StepMissionDetails } from './step-mission-details';
import { StepCheckout } from './step-checkout';
import { MissionData, OperationType } from './types';

interface BookingEngineCardProps {
    site: {
        toalFee: number;
        emergencyFee: number;
        bookingApprovalModel: string;
    };
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

    const nextStep = () => setStep((s) => Math.min(s + 1, 4));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const progressValue = (step / 4) * 100;
    const currentFee = operationType === 'toal' ? site.toalFee : site.emergencyFee;

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
                        <StepOperationType 
                            operationType={operationType} 
                            setOperationType={setOperationType} 
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

            <CardFooter className="py-4">
                <Button
                    onClick={step === 4 ? () => console.log('Booking...') : nextStep}
                    disabled={isNextDisabled()}
                    className='w-full'
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
