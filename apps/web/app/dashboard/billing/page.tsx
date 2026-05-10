'use client';

import * as React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { 
  Rocket, 
  Download, 
  Info, 
  Plus, 
  CheckCircle2, 
  XCircle,
  Filter
} from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { PaymentMethods } from './components/payment-methods';
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
          className={`capitalize flex items-center gap-1.5 w-fit ${
            status === 'paid' 
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
    }
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
    }
  }
];

const MOCK_BILLING_HISTORY: BillingHistory[] = [
  { id: '1', date: 'Aug 03, 2025', description: 'Pro Plan – Monthly', amount: '$29.00', status: 'paid' },
  { id: '2', date: 'Aug 01, 2025', description: 'Pro Plan – Monthly', amount: '$29.00', status: 'failed' },
  { id: '3', date: 'Jul 01, 2025', description: 'Pro Plan – Monthly', amount: '$29.00', status: 'paid' },
];

export default function BillingPage() {
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  return (
    <div className="flex flex-col gap-8 p-4 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      <header className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-lg">
          Manage your subscription, view payment history, and update your billing details — all in one place.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-4">Subscription Overview</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardDescription>Current Plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 mb-2 font-semibold">
                    Pro Plan
                  </Badge>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">$29</span>
                    <span className="text-muted-foreground">/ Month</span>
                  </div>
                </div>
                <Button className="bg-neutral-900 hover:bg-black text-white px-6 h-12 gap-2 shadow-lg">
                  Upgrade <Rocket size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Usage Summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">8,500 / 10,000</span>
                  <span className="text-muted-foreground">85%</span>
                </div>
                <Progress value={85} className="h-2 bg-muted [&>div]:bg-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">API Requests Used</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">2 GB / 5 GB</span>
                  <span className="text-muted-foreground">40%</span>
                </div>
                <Progress value={40} className="h-2 bg-muted [&>div]:bg-orange-500" />
                <p className="text-xs text-muted-foreground font-medium">Storage Used</p>
              </div>
            </CardContent>
          </Card>
        </div>
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
