'use client'

import * as React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Banknote, TrendingUp, ArrowRight, ArrowLeft, Info } from 'lucide-react'

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { cn } from '@workspace/ui/lib/utils'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { type SubscriptionPlan } from '@/services/subscription.service'
import { FormValues } from '../../schema'

interface SiteCommercialFormProps {
  form: UseFormReturn<FormValues>
  isLoading: boolean
  plans: SubscriptionPlan[]
  plansLoading: boolean
  plansError: string | null
  onNext: () => void
  onPrev: () => void
  globalDisabled?: boolean
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-60 text-center">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function FieldSection({
  title,
  tooltip,
  children,
}: {
  title: string
  tooltip?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      {children}
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-background p-4 shadow-sm">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  )
}

function parseMoneyInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '')
  if (cleaned === '' || cleaned === '.') {
    return undefined as any
  }

  const num = Number(cleaned)
  return isNaN(num) ? (undefined as any) : num
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function SiteCommercialForm({
  form,
  isLoading,
  plansLoading,
  plansError,
  onNext,
  onPrev,
  globalDisabled,
}: SiteCommercialFormProps) {
  const stepFields = ['toalFee', 'emergencyFee']
  const hasErrors = stepFields.some(field => form.formState.errors[field as keyof FormValues])
  const siteType = form.watch('siteType')
  const allowEmergencyLanding = form.watch('allowEmergencyLanding')

  const showToal = siteType !== 'emergency'
  const showEmergency = siteType === 'emergency' || !!allowEmergencyLanding

  const toalFee = Number(form.watch('toalFee') || 0)
  const emergencyFee = Number(form.watch('emergencyFee') || 0)

  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="relative pb-4 mb-2 border-b border-border/40">
        
        <div className="relative z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Commercial Setup
          </h2>
        </div>
      </div>

      <div>
        <div className="space-y-5">
          <FieldSection
            title="Service Fees"
            tooltip="Enter the payout you want to receive for each booking type."
          >
            <fieldset disabled={globalDisabled}>
              <FieldGroup className={cn("grid gap-4", showToal && showEmergency ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                {showToal && (
                  <Controller
                    name="toalFee"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          TOAL access fee *
                          <InfoTooltip content="Paid when the planned operation starts and is not canceled beforehand." />
                        </FieldLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">
                            £
                          </span>
                          <Input
                            {...field}
                            type="text"
                            inputMode="decimal"
                            value={field.value === 0 ? '' : (field.value ?? '')}
                            placeholder="0.00"
                            className="pl-7 h-12 bg-muted/20 border-input/50"
                            onChange={(e) =>
                              field.onChange(parseMoneyInput(e.target.value))
                            }
                            disabled={isLoading}
                          />
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                )}

                {showEmergency && (
                  <Controller
                    name="emergencyFee"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          Emergency and recovery access fee *
                          <InfoTooltip content="Paid only when the operator uses the site for emergency or recovery access." />
                        </FieldLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">
                            £
                          </span>
                          <Input
                            {...field}
                            type="text"
                            inputMode="decimal"
                            value={field.value === 0 ? '' : (field.value ?? '')}
                            placeholder="0.00"
                            className="pl-7 h-12 bg-muted/20 border-input/50"
                            onChange={(e) =>
                              field.onChange(parseMoneyInput(e.target.value))
                            }
                            disabled={isLoading}
                          />
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                )}
              </FieldGroup>
            </fieldset>
          </FieldSection>

          <FieldSection
            title="Payout summary"
            tooltip="You get paid when the operation starts and is not canceled. Emergency and recovery payouts apply only when the operator uses the site."
          >
            {plansLoading ? (
              <SummarySkeleton />
            ) : (
              <div className={cn("grid gap-3", showToal && showEmergency ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                {showToal && (
                  <div className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        Planned TOAL
                      </h4>
                      <InfoTooltip content="Paid when the operation starts and is not canceled beforehand." />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      You get paid {formatCurrency(toalFee)}.
                    </p>
                  </div>
                )}

                {showEmergency && (
                  <div className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        Emergency and recovery
                      </h4>
                      <InfoTooltip content="Paid only when the operator uses the site for emergency or recovery access." />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      You get paid {formatCurrency(emergencyFee)}.
                    </p>
                  </div>
                )}
              </div>
            )}

            {plansError ? (
              <p className="text-xs text-muted-foreground px-1">{plansError}</p>
            ) : (
              <p className="text-xs text-muted-foreground px-1 leading-relaxed"></p>
            )}
          </FieldSection>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              type="button"
              onClick={onPrev}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Policy
            </Button>
            <Button
              type="button"
              onClick={onNext}
              disabled={isLoading || hasErrors}
              className="gap-2 font-semibold shadow-md shadow-primary/20 min-w-35"
            >
              Review Site Details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
