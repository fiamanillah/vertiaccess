'use client'

import { CreditCard as CreditCardIcon, Info, ShieldCheck } from 'lucide-react'
import { Separator as UISeparator } from '@workspace/ui/components/separator'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { OperationType } from './types'
import type { PaymentMethod } from '@/services/booking.types'

interface StepCheckoutProps {
  operationType: OperationType
  currentFee: number
  defaultCard: PaymentMethod | null
  hasActiveSubscription: boolean
  subscriptionName: string | null
  subscriptionRenewal: string | null
  emergencyAuthAgreed: boolean
  onEmergencyAuthChange: (agreed: boolean) => void
}

export function StepCheckout({
  operationType,
  currentFee,
  defaultCard,
  hasActiveSubscription,
  subscriptionName,
  subscriptionRenewal,
  emergencyAuthAgreed,
  onEmergencyAuthChange,
}: StepCheckoutProps) {
  const platformFee = operationType === 'toal' && !hasActiveSubscription ? 5 : 0
  const totalDue = operationType === 'toal' ? currentFee + platformFee : 0
  const nextChargeLabel = hasActiveSubscription
    ? 'Covered by subscription'
    : 'Charged on booking start date'

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="bg-muted/30 rounded-xl p-5 border border-primary/5 space-y-4 shadow-sm">
          {operationType === 'toal' ? (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                  Site Access Fee
                </span>
                <span className="font-bold">£{currentFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                  Platform Service Fee
                </span>
                <span className="font-bold">
                  {hasActiveSubscription ? '£0.00' : '£5.00'}
                </span>
              </div>
              <UISeparator className="bg-primary/10" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-black uppercase tracking-widest text-primary">
                  Total Due Today
                </span>
                <span className="text-2xl font-black text-primary tracking-tighter">
                  £{totalDue.toFixed(2)}
                </span>
              </div>
              <div className="flex items-start gap-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-[10px] text-primary/80 font-medium leading-relaxed">
                  {nextChargeLabel}.
                </p>
              </div>
              {hasActiveSubscription && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-[10px] font-medium text-emerald-700">
                  Subscription: {subscriptionName ?? 'Active plan'}
                  {subscriptionRenewal
                    ? ` · Renews on ${subscriptionRenewal}`
                    : ''}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                  Standby Reservation Fee
                </span>
                <span className="font-bold">£0.00</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-amber-700 font-bold uppercase tracking-wider text-[10px]">
                  Emergency Fee (if used)
                </span>
                <span className="font-black text-amber-700">
                  £{currentFee.toFixed(2)}
                </span>
              </div>
              <UISeparator className="bg-amber-500/20" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-black uppercase tracking-widest text-foreground">
                  Total Due Today
                </span>
                <span className="text-2xl font-black text-foreground tracking-tighter">
                  £0.00
                </span>
              </div>
              <div className="flex items-start gap-2 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-700/80 font-medium leading-relaxed">
                  <strong>£0.00 is charged today.</strong> £
                  {currentFee.toFixed(2)} will only be charged to your card
                  ending {defaultCard?.last4 ?? '••••'} if you confirm site
                  usage after your operation window ends.
                </p>
              </div>

              {/* Authorization checkbox — required by backend */}
              <label
                htmlFor="emergency-auth"
                className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
              >
                <Checkbox
                  id="emergency-auth"
                  checked={emergencyAuthAgreed}
                  onCheckedChange={(v) => onEmergencyAuthChange(v as boolean)}
                  className="mt-0.5 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 shrink-0"
                />
                <span className="text-[10px] text-amber-800 font-medium leading-relaxed">
                  I authorise VertiAccess to charge{' '}
                  <strong>£{currentFee.toFixed(2)}</strong> to my{' '}
                  {defaultCard?.brand ?? 'card'} ending{' '}
                  {defaultCard?.last4 ?? '••••'} if I confirm an emergency
                  landing, or if an admin dispute finds that I utilised the
                  site.
                </span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Card on File */}
      <div className="p-4 rounded-2xl border border-border bg-muted/20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-background p-2 rounded-lg border shadow-sm">
            <CreditCardIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Card on File
            </p>
            {defaultCard ? (
              <>
                <p className="text-xs font-bold tracking-widest">
                  •••• {defaultCard.last4}
                </p>
                <p className="text-[9px] text-muted-foreground capitalize">
                  {defaultCard.brand} — {defaultCard.expiryMonth}/
                  {defaultCard.expiryYear}
                </p>
              </>
            ) : (
              <p className="text-xs font-bold text-destructive">
                No card on file
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
