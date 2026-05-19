'use client'

import * as React from 'react'
import { PaymentMethods } from './components/payment-methods'
import { SubscriptionOverview } from './components/subscription-overview'
import { BillingHistory } from './components/billing-history'

export default function BillingPage() {
  return (
    <div className="flex flex-1 flex-col gap-8  max-w-[1200px] mx-auto p-4">
      <header className="space-y-1.5 container mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Billing
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
          Manage your subscription, view payment history, and update your
          billing details — all in one place.
        </p>
      </header>

      <section className="space-y-4 container mx-auto w-full">
        <h2 className="text-xl font-semibold">Subscription Overview</h2>
        <SubscriptionOverview />
      </section>

      <div className="container mx-auto w-full">
        <BillingHistory />
      </div>

      <section className="space-y-4 container mx-auto w-full">
        <h2 className="text-xl font-semibold">Payment Method</h2>
        <PaymentMethods />
      </section>
    </div>
  )
}
