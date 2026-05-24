'use client'

import {
  CreditCard as CreditCardIcon,
  Loader2,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { Separator as UISeparator } from '@workspace/ui/components/separator'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Badge } from '@workspace/ui/components/badge'
import { cn } from '@workspace/ui/lib/utils'
import { OperationType } from './types'
import type {
  BookingCheckoutContext,
  PaymentMethod,
} from '@/services/booking.types'

interface StepCheckoutProps {
  operationType: OperationType
  checkoutContext: BookingCheckoutContext | null
  selectedPaymentMethodId: string | null
  onSelectPaymentMethod: (paymentMethodId: string) => void
  onAddCard: () => void
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

function PaymentCardOption({
  paymentMethod,
  selected,
  onSelect,
}: {
  paymentMethod: PaymentMethod
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-2xl border p-4 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/10'
          : 'border-border bg-background hover:border-primary/30 hover:bg-muted/20',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border bg-background p-2 shadow-sm">
            <CreditCardIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">
              •••• {paymentMethod.last4}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              {paymentMethod.brand} · {paymentMethod.expiryMonth}/
              {String(paymentMethod.expiryYear).slice(-2)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {paymentMethod.isDefault && (
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[9px]"
            >
              Default
            </Badge>
          )}
          <span
            className={cn(
              'h-4 w-4 rounded-full border-2',
              selected
                ? 'border-primary bg-primary'
                : 'border-muted-foreground/40 bg-transparent',
            )}
          />
        </div>
      </div>
    </button>
  )
}

export function StepCheckout({
  operationType,
  checkoutContext,
  selectedPaymentMethodId,
  onSelectPaymentMethod,
  onAddCard,
  emergencyAuthAgreed,
  onEmergencyAuthChange,
  isLoadingBilling,
  billingError,
}: StepCheckoutProps) {
  const paymentMethods = checkoutContext?.paymentMethods ?? []
  const subscription = checkoutContext?.subscription ?? null
  const pricing = checkoutContext?.pricing ?? null
  const selectedPaymentMethod =
    paymentMethods.find((card) => card.id === selectedPaymentMethodId) ??
    paymentMethods.find(
      (card) => card.id === checkoutContext?.defaultPaymentMethodId,
    ) ??
    paymentMethods[0] ??
    null

  const subscriptionLabel = subscription?.hasActiveSubscription
    ? (subscription.planName ?? 'Active subscription')
    : 'Pay as you go'

  const dueNow = pricing?.totalDueNow ?? 0
  const platformFee = pricing?.platformFee ?? 0
  const landownerFee = pricing?.landownerFee ?? 0
  const currency = pricing?.currency ?? 'GBP'

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-muted/20 p-5 shadow-sm space-y-4">
          {isLoadingBilling ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching billing details...
            </div>
          ) : billingError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {billingError}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Current subscription
                  </p>
                  <p className="text-sm font-bold">{subscriptionLabel}</p>
                  {subscription?.currentPeriodEnd && (
                    <p className="text-[10px] text-muted-foreground">
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
                    'text-[9px] uppercase tracking-widest',
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

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                    Landowner fee
                  </span>
                  <span className="font-bold">
                    {formatMoney(landownerFee, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                    VertiAccess service fee
                  </span>
                  <span className="font-bold">
                    {formatMoney(platformFee, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Total due now
                  </span>
                  <span className="text-xl font-black text-primary">
                    {formatMoney(dueNow, currency)}
                  </span>
                </div>
              </div>

              {operationType === 'emergency' && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] font-medium text-amber-800">
                  Emergency standby has no upfront charge and no funds are held.
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

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold">Payment cards</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onAddCard}>
            Add card
          </Button>
        </div>

        {isLoadingBilling ? (
          <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Loading saved cards...
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-5 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              No payment cards are saved on this account yet.
            </p>
            <Button type="button" onClick={onAddCard}>
              Add your first card
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((paymentMethod) => (
              <PaymentCardOption
                key={paymentMethod.id}
                paymentMethod={paymentMethod}
                selected={paymentMethod.id === selectedPaymentMethod?.id}
                onSelect={() => onSelectPaymentMethod(paymentMethod.id)}
              />
            ))}
          </div>
        )}
      </div>

      {operationType === 'emergency' && (
        <label
          htmlFor="emergency-auth"
          className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
        >
          <Checkbox
            id="emergency-auth"
            checked={emergencyAuthAgreed}
            onCheckedChange={(value) => onEmergencyAuthChange(Boolean(value))}
            className="mt-0.5 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 shrink-0"
          />
          <span className="text-[10px] text-amber-800 font-medium leading-relaxed">
            I authorise VertiAccess to charge the selected card only if I
            confirm an emergency landing was used, or usage is later validated
            through incident/dispute review.
            {selectedPaymentMethod ? (
              <strong className="block mt-1">
                Selected card: •••• {selectedPaymentMethod.last4}
              </strong>
            ) : (
              <strong className="block mt-1">Add a card to continue.</strong>
            )}
          </span>
        </label>
      )}

      {!isLoadingBilling &&
        !billingError &&
        checkoutContext?.requiresCard &&
        !selectedPaymentMethod && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[10px] font-medium text-destructive">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Add or select a card before submitting this booking.
          </div>
        )}
    </div>
  )
}
