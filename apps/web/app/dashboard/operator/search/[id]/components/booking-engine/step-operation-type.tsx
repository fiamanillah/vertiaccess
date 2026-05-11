'use client';

import { Target, Ambulance, CheckCircle2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { OperationType } from './types';

interface StepOperationTypeProps {
    operationType: OperationType;
    setOperationType: (type: OperationType) => void;
}

export function StepOperationType({ operationType, setOperationType }: StepOperationTypeProps) {
    return (
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
    );
}
