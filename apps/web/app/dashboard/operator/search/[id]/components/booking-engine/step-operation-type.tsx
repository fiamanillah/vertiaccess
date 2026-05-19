'use client';

import { Target, Ambulance, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { OperationType } from './types';
import { Badge } from '@workspace/ui/components/badge';

interface StepOperationTypeProps {
    operationType: OperationType;
    setOperationType: (type: OperationType) => void;
    site: any;
}

export function StepOperationType({ operationType, setOperationType, site }: StepOperationTypeProps) {
    const toalFee = site.toalAccessFee || 0;
    const emergencyFee = site.clzAccessFee || 0;
    const isToalDisabled = site.siteType === 'emergency' && !toalFee;
    const isEmergencyDisabled = !site.clzEnabled && site.siteType !== 'emergency';

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <p className="text-sm font-bold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Select Access Tier
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium ml-6">
                    Choose the level of access required for your mission
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <button
                    onClick={() => !isToalDisabled && setOperationType('toal')}
                    disabled={isToalDisabled}
                    className={cn(
                        "group relative flex flex-col gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-300",
                        operationType === 'toal'
                            ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                            : "border-border bg-background hover:border-primary/30",
                        isToalDisabled && "opacity-50 grayscale cursor-not-allowed border-muted"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="font-black text-sm uppercase tracking-wider block">Planned Take-off & Landing</span>
                            <div className="text-lg font-black text-primary tracking-tight">£{toalFee}.00</div>
                        </div>
                        {operationType === 'toal' && (
                            <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg shadow-primary/20">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Standard access for launching and landing your drone as part of a planned flight path. Charged upfront.
                    </p>
                    {isToalDisabled && (
                        <Badge variant="secondary" className="absolute top-2 right-2 text-[8px] font-bold">UNAVAILABLE</Badge>
                    )}
                </button>

                <button
                    onClick={() => !isEmergencyDisabled && setOperationType('emergency')}
                    disabled={isEmergencyDisabled}
                    className={cn(
                        "group relative flex flex-col gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-300",
                        operationType === 'emergency'
                            ? "border-amber-500 bg-amber-500/5 ring-4 ring-amber-500/10"
                            : "border-border bg-background hover:border-amber-500/30",
                        isEmergencyDisabled && "opacity-50 grayscale cursor-not-allowed border-muted"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <span className="font-black text-sm uppercase tracking-wider block">Emergency & Recovery Standby</span>
                                <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] h-4 font-bold flex items-center gap-1">
                                    🛡️ Pay Only If Used
                                </Badge>
                            </div>
                            <div className="text-lg font-black text-amber-600 tracking-tight">£{emergencyFee}.00</div>
                        </div>
                        {operationType === 'emergency' && (
                            <div className="bg-amber-500 text-white rounded-full p-1 shadow-lg shadow-amber-500/20">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Secure this site as a safe-haven. You will only be charged the higher fee if you declare an emergency and land here.
                    </p>
                    {isEmergencyDisabled && (
                        <Badge variant="secondary" className="absolute top-2 right-2 text-[8px] font-bold">UNAVAILABLE</Badge>
                    )}
                </button>
            </div>
        </div>
    );
}
