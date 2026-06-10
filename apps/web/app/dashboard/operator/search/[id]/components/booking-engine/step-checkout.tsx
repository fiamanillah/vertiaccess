'use client'

import {
  Loader2,
} from 'lucide-react'
import { Separator as UISeparator } from '@workspace/ui/components/separator'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Badge } from '@workspace/ui/components/badge'
import { cn } from '@workspace/ui/lib/utils'
import { OperationType } from './types'
import type {
  BookingCheckoutContext,
} from '@/services/booking.types'

interface StepCheckoutProps {
  operationType: OperationType
  checkoutContext: BookingCheckoutContext | null
  emergencyAuthAgreed: boolean
  onEmergencyAuthChange: (agreed: boolean) => void
  isLoadingBilling: boolean
  billingError: string | null
}

function formatMoney(value: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function StepCheckout({
  operationType,
  checkoutContext,
  emergencyAuthAgreed,
  onEmergencyAuthChange,
  isLoadingBilling,
  billingError,
}: StepCheckoutProps) {
  const subscription = checkoutContext?.subscription ?? null
  const pricing = checkoutContext?.pricing ?? null

  const subscriptionLabel = subscription?.hasActiveSubscription
    ? (subscription.planName ?? 'Active subscription')
    : 'Pay as you go'

  const dueNow = pricing?.totalDueNow ?? 0
  const platformFee = pricing?.platformFee ?? 0
  const assetManagerFee = pricing?.assetManagerFee ?? 0
  const currency = pricing?.currency ?? 'GBP'
  
  const isWaived = pricing?.isWaived ?? false
  const waivedBookingsLimit = pricing?.waivedBookingsLimit ?? null
  const waivedBookingsUsed = pricing?.waivedBookingsUsed ?? 0
  const waivedBookingsRemaining = pricing?.waivedBookingsRemaining ?? null
  const defaultPlatformFee = pricing?.defaultPlatformFee ?? 5

  return (
    <div className="space-y-3.5">
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-muted/20 p-3.5 shadow-sm space-y-3">
          {isLoadingBilling ? (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Fetching billing details...
            </div>
          ) : billingError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              {billingError}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2.5">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Current Subscription
                  </p>
                  <p className="text-sm font-bold">{subscriptionLabel}</p>
                  {subscription?.currentPeriodEnd && (
                    <p className="text-xs text-muted-foreground">
                      Renews on{' '}
                      {new Date(
                        subscription.currentPeriodEnd,
                      ).toLocaleDateString('en-GB')}
                    </p>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs px-2 py-0.5 h-5 font-semibold',
                    subscription?.hasActiveSubscription
                      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 border-amber-500/20',
                  )}
                >
                  {subscription?.hasActiveSubscription
                    ? 'Subscription'
                    : 'PAYG'}
                </Badge>
              </div>

              <UISeparator />

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-semibold">
                    Asset Manager Fee
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(assetManagerFee, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-semibold">
                    VertiAccess Service Fee
                  </span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    {isWaived ? (
                      <>
                        <span className="line-through text-muted-foreground/60 text-xs font-medium">
                          {formatMoney(defaultPlatformFee, currency)}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] px-1.5 py-0 h-4 font-semibold shrink-0"
                        >
                          Waived
                        </Badge>
                      </>
                    ) : (
                      formatMoney(platformFee, currency)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/40 mt-1">
                  <span className="text-xs font-bold text-primary">
                    Total Due Now
                  </span>
                  <span className="text-base font-bold text-primary">
                    {formatMoney(dueNow, currency)}
                  </span>
                </div>
              </div>

              {operationType !== 'emergency' &&
                subscription?.hasActiveSubscription && (
                  isWaived ? (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-xs font-medium text-emerald-800">
                      Your subscription covers the VertiAccess service fee
                      {waivedBookingsLimit !== null ? ` (${waivedBookingsRemaining} of ${waivedBookingsLimit} remaining this month)` : ' (Unlimited)'}. You
                      still pay the site access fee to the asset owner now.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-xs font-medium text-amber-800">
                      You have reached your subscription's waived bookings limit
                      {waivedBookingsLimit !== null && ` (${waivedBookingsUsed}/${waivedBookingsLimit} used)`}. The standard per-booking service fee has been applied.
                    </div>
                  )
                )}

              {operationType !== 'emergency' && !subscription?.hasActiveSubscription && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-xs font-medium text-amber-800">
                  Pay-as-you-go pricing includes both the site fee and the
                  VertiAccess service fee in the total above.
                </div>
              )}

              {operationType === 'emergency' && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-xs font-medium text-amber-800">
                  Emergency and recovery has no upfront charge and no funds are held.
                  You only authorize an off-session charge if the site is
                  confirmed as used.
                  {pricing?.authorizationAmount != null && (
                    <span className="block mt-1 font-bold">
                      Charge amount if used:{' '}
                      {formatMoney(pricing.authorizationAmount, currency)}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {operationType === 'emergency' && (
        <label
          htmlFor="emergency-auth"
          className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
        >
          <Checkbox
            id="emergency-auth"
            checked={emergencyAuthAgreed}
            onCheckedChange={(value) => onEmergencyAuthChange(Boolean(value))}
            className="mt-0.5 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 shrink-0"
          />
          <span className="text-xs text-amber-800 font-medium leading-relaxed">
            I authorise VertiAccess to charge the standby recovery fee only if I
            confirm an emergency landing was used, or usage is later validated
            through incident/dispute review.
          </span>
        </label>
      )}
    </div>
  )
}

