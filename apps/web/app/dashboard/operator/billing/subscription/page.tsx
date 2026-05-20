'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ArrowLeft, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  subscriptionService,
  type SubscriptionPlan,
  type UserSubscriptionStatus,
} from '@/services/subscription.service'
import { CheckoutModal } from './components/checkout-modal'

export default function OperatorSubscriptionPage() {
  const router = useRouter()
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([])
  const [currentSub, setCurrentSub] =
    React.useState<UserSubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [billingInterval, setBillingInterval] = React.useState<
    'month' | 'year'
  >('month')
  const [selectedPlan, setSelectedPlan] = React.useState<any | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false)

  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        subscriptionService.listPlans(false),
        subscriptionService.getSubscriptionStatus(),
      ])

      if (plansRes.success) {
        // Order plans: PAYG first, then by price ascending
        const sortedPlans = [...plansRes.data].sort((a, b) => {
          if (a.billingType === 'payg') return -1
          if (b.billingType === 'payg') return 1
          return Number(a.monthlyPrice) - Number(b.monthlyPrice)
        })
        setPlans(sortedPlans)
      }
      if (subRes.success) {
        setCurrentSub(subRes.data)
      }
    } catch (error: any) {
      console.error(error)
      toast.error(
        error.message || 'Failed to load plans or subscription status',
      )
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [])

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    const billingType = plan.billingType || 'subscription'

    setSelectedPlan({
      id: plan.id,
      name: plan.name,
      price:
        billingType === 'payg'
          ? Number(plan.platformFee || plan.monthlyPrice || 0)
          : Number(plan.monthlyPrice),
      billingType,
      currency: plan.currency,
    })
    setIsCheckoutOpen(true)
  }

  const getCurrencySymbol = (cur: string) => {
    switch (cur.toUpperCase()) {
      case 'USD':
        return '$'
      case 'EUR':
        return '€'
      default:
        return '£'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-10 space-y-8 animate-pulse">
        <div className="space-y-4 text-center">
          <Skeleton className="h-4 w-24 mx-auto" />
          <Skeleton className="h-10 w-2/3 md:w-1/3 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-10 space-y-8">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/operator/billing')}
          className="gap-2 text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowLeft size={16} /> Back to Billing
        </Button>
      </div>

      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline">Pricing Plans</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Choose the Perfect Plan for Your Flights
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          Select a tier that matches your flight frequency. Upgrades are applied
          instantly and downgrades take effect at the end of the billing period.
        </p>
      </div>

      {/* Billing Switch */}
      <div className="flex justify-center items-center gap-4">
        <span
          className={`text-sm font-semibold transition-colors ${billingInterval === 'month' ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          Monthly
        </span>
        <button
          onClick={() =>
            setBillingInterval((prev) => (prev === 'month' ? 'year' : 'month'))
          }
          className="w-14 h-8 bg-muted rounded-full p-1 transition-all relative border border-border focus:outline-none"
          aria-label="Toggle billing interval"
        >
          <div
            className={`w-6 h-6 rounded-full bg-primary shadow-md transition-all absolute top-1 ${
              billingInterval === 'year' ? 'left-7' : 'left-1'
            }`}
          />
        </button>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm font-semibold transition-colors ${billingInterval === 'year' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Annual
          </span>
          <Badge variant="secondary" className="font-semibold text-xs">
            Save 20%
          </Badge>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {plans.map((plan) => {
          const isPayg = plan.billingType === 'payg'

          // Determine if this plan is the user's current plan
          const isCurrent = !!(currentSub && currentSub.planId === plan.id)
          const isPopular =
            plan.name.toLowerCase().includes('pro') ||
            plan.name.toLowerCase().includes('standard')

          // Calculate pricing
          const monthlyPrice = Number(plan.monthlyPrice)
          const annualPrice =
            Number(plan.annualPrice) > 0
              ? Number(plan.annualPrice)
              : monthlyPrice * 0.8 * 12 // Fallback to 20% off monthly price if annual is 0

          const priceToShow = isPayg
            ? Number(plan.platformFee || plan.monthlyPrice || 0)
            : billingInterval === 'year'
              ? annualPrice / 12
              : monthlyPrice

          const bulletFeatures =
            plan.customFeatures && plan.customFeatures.length > 0
              ? plan.customFeatures.map((f) => f.name)
              : [
                  isPayg
                    ? 'Pay-per-booking rates'
                    : 'Flat rate subscription fees',
                  'Access to verified flight takeoff/landing slots',
                  'Basic operations support',
                  'Safety checklist verification',
                ]

          return (
            <Card
              key={plan.id}
              className={`flex flex-col justify-between relative border overflow-visible ${
                isCurrent
                  ? 'border-primary ring-1 ring-primary/30'
                  : 'border-border'
              }`}
            >
              {isPopular && !isCurrent && (
                <div className="absolute top-0 right-4 transform -translate-y-1/2">
                  <Badge variant="default" className="text-xs font-semibold">
                    Popular
                  </Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-0 right-4 transform -translate-y-1/2">
                  <Badge
                    variant="default"
                    className="bg-primary text-primary-foreground border-none text-xs font-semibold"
                  >
                    Active Plan
                  </Badge>
                </div>
              )}

              <div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-xs min-h-[40px] leading-relaxed">
                    {plan.description ||
                      (isPayg
                        ? 'Pay only for what you fly'
                        : 'Monthly flight subscription')}
                  </CardDescription>

                  <div className="pt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">
                      {getCurrencySymbol(plan.currency)}
                      {priceToShow.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-xs font-semibold ml-1.5">
                      {isPayg ? '/booking' : '/mo'}
                    </span>
                  </div>
                  {!isPayg && billingInterval === 'year' && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Billed annually ({getCurrencySymbol(plan.currency)}
                      {annualPrice.toFixed(2)}/yr)
                    </p>
                  )}
                </CardHeader>

                <CardContent className="pb-6">
                  <div className="border-t border-muted/50 my-2" />
                  <ul className="space-y-3 text-xs font-medium text-muted-foreground">
                    {bulletFeatures.map((feat: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="text-primary shrink-0 mt-0.5"
                        />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </div>

              <CardFooter className="pt-4 bg-muted/10 border-t mt-auto">
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent}
                  variant={
                    isCurrent ? 'outline' : isPopular ? 'default' : 'secondary'
                  }
                  className="w-full font-semibold"
                  size="sm"
                >
                  {isCurrent ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check size={14} /> Active
                    </span>
                  ) : isPayg ? (
                    'Select PAYG'
                  ) : (
                    'Select Plan'
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        plan={selectedPlan}
        interval={billingInterval}
        onSuccess={fetchData}
      />
    </div>
  )
}
