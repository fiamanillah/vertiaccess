'use client';

import { cn } from '@workspace/ui/lib/utils';
import { Check, Pencil } from 'lucide-react';

interface Step {
    id: number;
    title: string;
    description?: string;
}

interface FormStepperProps {
    steps: Step[];
    currentStep: number;
    maxStepReached: number;
    onStepClick?: (stepId: number) => void;
}

export function FormStepper({ steps, currentStep, maxStepReached, onStepClick }: FormStepperProps) {
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
                        const isClickable = step.id <= maxStepReached && !isActive;

                        return (
                            <li key={step.id} className="relative flex flex-1 flex-col items-center">
                                {/* Filled connector line (before this step) */}
                                {stepIdx > 0 && (
                                    <div
                                        className={cn(
                                            "absolute top-5 right-1/2 w-full h-px transition-all duration-500 -z-0",
                                            (currentStep >= step.id) ? "bg-primary" : "bg-border"
                                        )}
                                    />
                                )}
                                {/* Step circle */}
                                <button
                                    type="button"
                                    disabled={!isClickable}
                                    onClick={() => isClickable && onStepClick?.(step.id)}
                                    className={cn(
                                        "group relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                                        isClickable
                                            ? "cursor-pointer hover:scale-110 hover:border-primary active:scale-95"
                                            : "cursor-default",
                                        isCompleted
                                            ? "bg-primary border-primary shadow-md shadow-primary/30"
                                            : isActive
                                            ? "bg-background border-primary text-primary shadow-lg shadow-primary/20 ring-4 ring-primary/10"
                                            : (step.id <= maxStepReached)
                                            ? "bg-background border-primary/40 text-primary/70"
                                            : "bg-background border-border text-muted-foreground"
                                    )}
                                >
                                    {isCompleted ? (
                                        <>
                                            <Check className="h-5 w-5 text-primary-foreground transition-all group-hover:scale-0 group-hover:opacity-0" strokeWidth={2.5} />
                                            <Pencil className="absolute h-4 w-4 text-primary-foreground opacity-0 scale-0 transition-all group-hover:scale-100 group-hover:opacity-100" />
                                        </>
                                    ) : (
                                        <>
                                            <span className={cn(
                                                "text-sm font-semibold transition-all group-hover:opacity-0 group-hover:scale-0",
                                                isActive ? "text-primary" : (step.id <= maxStepReached ? "text-primary/70" : "text-muted-foreground")
                                            )}>
                                                {step.id}
                                            </span>
                                            {isClickable && (
                                                <Pencil className="absolute h-4 w-4 text-primary opacity-0 scale-0 transition-all group-hover:scale-100 group-hover:opacity-100" />
                                            )}
                                        </>
                                    )}
                                </button>
                                {/* Step label */}
                                <div 
                                    className={cn(
                                        "mt-3 text-center px-1 transition-colors",
                                        isClickable && "cursor-pointer"
                                    )}
                                    onClick={() => isClickable && onStepClick?.(step.id)}
                                >
                                    <span className={cn(
                                        "block text-[10px] font-bold uppercase tracking-widest leading-tight transition-colors",
                                        isActive
                                            ? "text-primary"
                                            : (step.id <= maxStepReached)
                                            ? "text-foreground group-hover:text-primary"
                                            : "text-muted-foreground"
                                    )}>
                                        {step.title}
                                    </span>
                                    {step.description && (
                                        <span className="hidden sm:block text-[9px] text-muted-foreground mt-0.5 leading-tight">
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
