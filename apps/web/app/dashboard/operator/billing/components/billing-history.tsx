'use client';

import * as React from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Download, Info, CheckCircle2, XCircle, Filter, ArrowUpDown, Loader2, Receipt } from 'lucide-react';
import { InvoiceModal } from './invoice-modal';
import { DataTable } from '@/components/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@workspace/ui/components/dropdown-menu';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { paymentService } from '@/services/payments/payment.service';
import type { Transaction } from '@/services/payments/payment.types';
import { format } from 'date-fns';
import { toast } from 'sonner';

const getBillingColumns = (onViewInvoice: (tx: Transaction) => void): ColumnDef<Transaction>[] => [
    {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => {
            const date = new Date(row.original.createdAt);
            return <span>{format(date, 'MMM dd, yyyy')}</span>;
        },
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
            const { transactionType, siteName, bookingReference } = row.original;
            if (transactionType === 'PAYG_BOOKING') {
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">Site Access Fee</span>
                        {siteName && (
                            <span className="text-muted-foreground text-xs font-mono">
                                {siteName}{bookingReference ? ` · ${bookingReference}` : ''}
                            </span>
                        )}
                    </div>
                );
            }
            if (transactionType === 'EMERGENCY_CHARGE') {
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">Emergency Landing Fee</span>
                        {siteName && (
                            <span className="text-muted-foreground text-xs font-mono">
                                {siteName}{bookingReference ? ` · ${bookingReference}` : ''}
                            </span>
                        )}
                    </div>
                );
            }
            if (transactionType === 'SUBSCRIPTION') {
                return <span className="font-medium text-sm text-foreground">Subscription Payment</span>;
            }
            return <span className="font-medium text-sm text-foreground capitalize">{transactionType.toLowerCase().replace(/_/g, ' ')}</span>;
        },
    },
    {
        accessorKey: 'payment',
        header: 'Payment Method',
        cell: ({ row }) => {
            const { cardBrand, cardLast4 } = row.original;
            if (!cardBrand || !cardLast4) {
                return <span className="text-muted-foreground text-xs italic">—</span>;
            }
            return (
                <div className="flex items-center gap-2">
                    <span className="capitalize font-medium text-sm text-foreground">{cardBrand}</span>
                    <span className="text-muted-foreground text-xs font-mono">•••• {cardLast4}</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
            const { amount, currency } = row.original;
            const symbol = currency === 'GBP' ? '£' : '$';
            return <span className="font-semibold text-foreground">{symbol}{amount.toFixed(2)}</span>;
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status;
            const displayStatus = status === 'charged' ? 'paid' : status;
            return (
                <Badge
                    variant="outline"
                    className={`capitalize flex items-center gap-1.5 w-fit ${
                        status === 'charged'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : status === 'failed'
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}
                >
                    {status === 'charged' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {displayStatus}
                </Badge>
            );
        },
    },
    {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => {
            const tx = row.original;
            const { status } = tx;
            if (status === 'failed' || status === 'pending') {
                return (
                    <TooltipProvider>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm italic">
                            No Action
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info size={14} className="cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        {status === 'failed'
                                            ? 'This payment failed. Please check your card details.'
                                            : 'This payment is currently being processed.'}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                );
            }
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-xs font-bold"
                    onClick={() => onViewInvoice(tx)}
                >
                    Invoice <Receipt size={14} />
                </Button>
            );
        },
    },
];

export function BillingHistory() {
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 5 });
    const [statusFilter, setStatusFilter] = React.useState<string>('all');
    const [sortOrder, setSortOrder] = React.useState<string>('desc');
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [totalRows, setTotalRows] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(1);

    const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = React.useState(false);

    const handleViewInvoice = React.useCallback((tx: Transaction) => {
        setSelectedTx(tx);
        setIsInvoiceOpen(true);
    }, []);

    const columns = React.useMemo(() => getBillingColumns(handleViewInvoice), [handleViewInvoice]);

    const fetchTransactions = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await paymentService.listTransactions({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                status: statusFilter,
                sort: sortOrder,
            });
            setTransactions(res.transactions);
            setTotalRows(res.pagination.totalCount);
            setTotalPages(res.pagination.totalPages);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    }, [pagination.pageIndex, pagination.pageSize, statusFilter, sortOrder]);

    React.useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Reset page to index 0 when filters/sort order changes
    React.useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [statusFilter, sortOrder]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Billing History</h2>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowUpDown size={14} /> Sort
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-40" align="end">
                            <DropdownMenuLabel>Sort by Date</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
                                <DropdownMenuRadioItem value="desc">Newest First</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="asc">Oldest First</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Filter size={14} /> Filter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="charged">Paid</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="failed">Failed</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="w-full overflow-x-auto rounded-md">
                <div className="min-w-[800px] lg:min-w-0">
                    <DataTable
                        columns={columns}
                        data={transactions}
                        totalPages={totalPages}
                        totalRows={totalRows}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        isLoading={loading}
                    />
                </div>
            </div>

            <InvoiceModal
                open={isInvoiceOpen}
                onOpenChange={setIsInvoiceOpen}
                transaction={selectedTx}
            />
        </div>
    );
}
