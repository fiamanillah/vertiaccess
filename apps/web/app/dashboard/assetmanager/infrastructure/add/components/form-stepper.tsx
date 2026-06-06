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
    maxStepReached: number;
    onStepClick?: (stepId: number) => void;
}

export function FormStepper({ steps, currentStep, maxStepReached, onStepClick }: FormStepperProps) {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex flex-col gap-1">
                {steps.map((step, stepIdx) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;
                    const isClickable = step.id <= maxStepReached && !isActive;
                    const isLast = stepIdx === steps.length - 1;

                    return (
                        <li key={step.id} className="relative">
                            {/* Connector line */}
                            {!isLast && (
                                <div
                                    className={cn(
                                        "absolute left-4 top-[36px] w-px h-[calc(100%-20px)]",
                                        isCompleted ? "bg-primary" : "bg-border"
                                    )}
                                    aria-hidden="true"
                                />
                            )}

                            <button
                                type="button"
                                disabled={!isClickable}
                                onClick={() => isClickable && onStepClick?.(step.id)}
                                className={cn(
                                    "relative z-10 flex w-full items-center gap-3 py-2 px-1.5 rounded-md text-left transition-colors",
                                    isClickable && "cursor-pointer hover:bg-accent",
                                    !isClickable && "cursor-default",
                                    isActive && "bg-accent"
                                )}
                            >
                                {/* Circle */}
                                <div
                                    className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold border transition-colors",
                                        isCompleted
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : isActive
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border bg-background text-muted-foreground"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                    ) : (
                                        step.id
                                    )}
                                </div>

                                {/* Label */}
                                <div className="min-w-0">
                                    <p className={cn(
                                        "text-sm font-medium leading-tight truncate",
                                        isActive ? "text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {step.title}
                                    </p>
                                    {step.description && (
                                        <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                                            {step.description}
                                        </p>
                                    )}
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
