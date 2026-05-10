'use client';

import { cn } from '@workspace/ui/lib/utils';
import { Check } from 'lucide-react';

interface Step {
    id: number;
    title: string;
    description?: string;
}

interface FormStepperProps {
    steps: Step[];
    currentStep: number;
}

export function FormStepper({ steps, currentStep }: FormStepperProps) {
    return (
        <nav aria-label="Progress" className="mb-10">
            {/* Connector line track */}
            <div className="relative">
                <ol role="list" className="relative flex items-start justify-between">
                    {/* Background connector track */}
                    <div className="absolute top-5 left-0 right-0 h-px bg-border mx-5 -z-0" />

                    {steps.map((step, stepIdx) => {
                        const isCompleted = currentStep > step.id;
                        const isActive = currentStep === step.id;

                        return (
                            <li key={step.id} className="relative flex flex-1 flex-col items-center">
                                {/* Filled connector line (before this step) */}
                                {stepIdx > 0 && (
                                    <div
                                        className={cn(
                                            "absolute top-5 right-1/2 left-0 h-px transition-all duration-500 -z-0",
                                            isCompleted || isActive ? "bg-primary" : "bg-border"
                                        )}
                                    />
                                )}
                                {/* Step circle */}
                                <div
                                    className={cn(
                                        "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                                        isCompleted
                                            ? "bg-primary border-primary shadow-md shadow-primary/30"
                                            : isActive
                                            ? "bg-background border-primary text-primary shadow-lg shadow-primary/20 ring-4 ring-primary/10"
                                            : "bg-background border-border text-muted-foreground"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                                    ) : (
                                        <span className={cn(
                                            "text-sm font-semibold",
                                            isActive ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {step.id}
                                        </span>
                                    )}
                                </div>
                                {/* Step label */}
                                <div className="mt-3 text-center px-1">
                                    <span className={cn(
                                        "block text-xs font-semibold uppercase tracking-wider leading-tight",
                                        isActive
                                            ? "text-primary"
                                            : isCompleted
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                    )}>
                                        {step.title}
                                    </span>
                                    {step.description && (
                                        <span className="hidden sm:block text-[10px] text-muted-foreground mt-0.5 leading-tight">
                                            {step.description}
                                        </span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </nav>
    );
}
