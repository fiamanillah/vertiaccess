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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Separator } from '@workspace/ui/components/separator'
import { Badge } from '@workspace/ui/components/badge'
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
        <TooltipContent side="top" className="max-w-[240px] text-center">
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
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      {children}
    </div>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function PricingSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-background p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-4 w-72" />
    </div>
  )
}

function PlanCardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  )
}

export function SiteCommercialForm({
  form,
  isLoading,
  plans,
  plansLoading,
  plansError,
  onNext,
  onPrev,
  globalDisabled,
}: SiteCommercialFormProps) {
  const toalFee = Number(form.watch('toalFee') || 0)
  const emergencyFee = Number(form.watch('emergencyFee') || 0)

  const paygPlan = React.useMemo(
    () => plans.find((plan) => plan.billingType === 'payg') ?? null,
    [plans],
  )
  const subscriptionPlans = React.useMemo(
    () => plans.filter((plan) => plan.billingType === 'subscription'),
    [plans],
  )

  const paygPlatformFee = paygPlan?.platformFee ?? 0
  const operatorPaysToal = toalFee + (paygPlan ? paygPlatformFee : 0)
  const operatorPaysEmergency = emergencyFee + (paygPlan ? paygPlatformFee : 0)

  return (
    <Card className="shadow-md border-border/60">
      <CardHeader className="relative overflow-hidden pb-6 border-b">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
        <div className="relative z-10">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Commercial Setup
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-8">
        <div className="space-y-8">
          <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex gap-4 items-start">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">Transparent Pricing</h4>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-none text-[10px] h-4"
                >
                  No cut from your fee
                </Badge>
              </div>
              <p className="text-sm font-bold text-foreground">
                Operators pay the site price plus the platform plan fee.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your TOAL and emergency amounts are the landowner payout. The
                platform fee is billed separately through the active billing
                plan.
              </p>
            </div>
          </div>

          <FieldSection
            title="Service Fees"
            tooltip="Set the amount you earn per booking type. Operators pay this plus the platform fee separately."
          >
            <fieldset disabled={globalDisabled}>
              <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="toalFee"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="flex items-center gap-2">
                        TOAL Access Fee *
                        <InfoTooltip content="Your payout per planned take-off & landing booking. Operators pay this on top of the platform fee." />
                      </FieldLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">
                          £
                        </span>
                        <Input
                          {...field}
                          type="number"
                          placeholder="0.00"
                          className="pl-7 h-12 bg-muted/20 border-input/50"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
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

                <Controller
                  name="emergencyFee"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="flex items-center gap-2">
                        Emergency Access Fee *
                        <InfoTooltip content="Your payout per emergency recovery booking. This fee is separate from the platform fee paid by the operator." />
                      </FieldLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">
                          £
                        </span>
                        <Input
                          {...field}
                          type="number"
                          placeholder="0.00"
                          className="pl-7 h-12 bg-muted/20 border-input/50"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
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
              </FieldGroup>
            </fieldset>
          </FieldSection>

          <Separator />

          <FieldSection
            title="Operator Cost Breakdown"
            tooltip="A live preview of what the operator will pay. Your payout is never reduced by the platform fee."
          >
            {plansLoading ? (
              <PricingSkeleton />
            ) : (
              <div className="space-y-4 rounded-xl border border-border/60 bg-background shadow-sm overflow-hidden">
                <div className="grid divide-y divide-border/60">
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground">
                            Planned TOAL booking
                          </h4>
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 bg-primary/10 text-primary border-none"
                          >
                            Landowner payout
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          The operator pays your booking fee and the platform
                          plan fee separately.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          You receive
                        </p>
                        <p className="text-xl font-black text-foreground">
                          {formatCurrency(toalFee)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Site fee
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatCurrency(toalFee)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Platform fee
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {paygPlan
                            ? `${formatCurrency(paygPlatformFee)} ${paygPlan.unitLabel || '/booking'}`
                            : 'Billed via subscription'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Operator pays
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatCurrency(operatorPaysToal)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground">
                            Emergency recovery booking
                          </h4>
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 bg-amber-500/10 text-amber-600 border-none"
                          >
                            Higher priority
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Emergency recovery uses the same transparent structure
                          with no deduction from your fee.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          You receive
                        </p>
                        <p className="text-xl font-black text-foreground">
                          {formatCurrency(emergencyFee)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Site fee
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatCurrency(emergencyFee)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Platform fee
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {paygPlan
                            ? `${formatCurrency(paygPlatformFee)} ${paygPlan.unitLabel || '/booking'}`
                            : 'Billed via subscription'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Operator pays
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatCurrency(operatorPaysEmergency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">
              {paygPlan
                ? `The current PAYG plan charges ${formatCurrency(paygPlatformFee)} ${paygPlan.unitLabel || 'per booking'} on top of the site fee.`
                : 'Subscription billing means the operator pays the platform monthly instead of taking a cut from your site fee.'}
            </p>
          </FieldSection>

          <div className="flex items-center justify-between pt-6 border-t mt-4">
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
              disabled={isLoading}
              className="gap-2 font-semibold shadow-md shadow-primary/20 min-w-35"
              size="lg"
            >
              Review Site Details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
