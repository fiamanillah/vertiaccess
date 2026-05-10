'use client';

import * as React from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Download, Info, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { PaymentMethods } from './components/payment-methods';
import { SubscriptionOverview } from './components/subscription-overview';
import { type ColumnDef } from '@tanstack/react-table';

type BillingHistory = {
	id: string;
	date: string;
	description: string;
	amount: string;
	status: 'paid' | 'failed' | 'pending';
};

const billingColumns: ColumnDef<BillingHistory>[] = [
	{
		accessorKey: 'date',
		header: 'Date',
	},
	{
		accessorKey: 'description',
		header: 'Description',
	},
	{
		accessorKey: 'amount',
		header: 'Amount',
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => {
			const status = row.original.status;
			return (
				<Badge
					variant="outline"
					className={`capitalize flex items-center gap-1.5 w-fit ${status === 'paid'
						? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
						: status === 'failed'
							? 'bg-destructive/10 text-destructive border-destructive/20'
							: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
						}`}
				>
					{status === 'paid' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
					{status}
				</Badge>
			);
		},
	},
	{
		id: 'action',
		header: 'Action',
		cell: ({ row }) => {
			const status = row.original.status;
			if (status === 'failed') {
				return (
					<div className="flex items-center gap-2 text-muted-foreground text-sm italic">
						No Action Available <Info size={14} />
					</div>
				);
			}
			return (
				<Button variant="ghost" size="sm" className="flex items-center gap-2">
					Download Invoice <Download size={14} />
				</Button>
			);
		},
	},
];

const MOCK_BILLING_HISTORY: BillingHistory[] = [
	{
		id: '1',
		date: 'Aug 03, 2025',
		description: 'Pro Plan – Monthly',
		amount: '$29.00',
		status: 'paid',
	},
	{
		id: '2',
		date: 'Aug 01, 2025',
		description: 'Pro Plan – Monthly',
		amount: '$29.00',
		status: 'failed',
	},
	{
		id: '3',
		date: 'Jul 01, 2025',
		description: 'Pro Plan – Monthly',
		amount: '$29.00',
		status: 'paid',
	},
];

export default function BillingPage() {
	const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

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

			<section>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold">Billing History</h2>
					<Button variant="outline" size="sm" className="gap-2">
						Filter <Filter size={14} />
					</Button>
				</div>
				<DataTable
					columns={billingColumns}
					data={MOCK_BILLING_HISTORY}
					totalPages={1}
					totalRows={MOCK_BILLING_HISTORY.length}
					pagination={pagination}
					onPaginationChange={setPagination}
				/>
			</section>

			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Payment Method</h2>
				<PaymentMethods />
			</section>
		</div>
	);
}
