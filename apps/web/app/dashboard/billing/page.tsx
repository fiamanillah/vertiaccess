'use client';

import * as React from 'react';
import { PaymentMethods } from './components/payment-methods';
import { SubscriptionOverview } from './components/subscription-overview';
import { BillingHistory } from './components/billing-history';

export default function BillingPage() {
	return (
		<div className="flex flex-col gap-8 p-4 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
			<header className="space-y-1">
				<h1 className="text-4xl font-bold tracking-tight">Billing</h1>
				<p className="text-muted-foreground text-lg">
					Manage your subscription, view payment history, and update your billing details — all in
					one place.
				</p>
			</header>

			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Subscription Overview</h2>
				<SubscriptionOverview />
			</section>

			<BillingHistory />


			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Payment Method</h2>
				<PaymentMethods />
			</section>
		</div>
	);
}
