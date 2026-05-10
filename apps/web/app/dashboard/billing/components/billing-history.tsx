'use client';

import * as React from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Download, Info, CheckCircle2, XCircle, Filter, ArrowUpDown } from 'lucide-react';
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

type BillingHistoryItem = {
    id: string;
    date: string;
    description: string;
    amount: string;
    status: 'paid' | 'failed' | 'pending';
    cardBrand: string;
    cardLast4: string;
    rawDate: number; // for sorting
};

// Generate 25 mock records for testing
const generateMockData = (): BillingHistoryItem[] => {
    const statuses: ('paid' | 'failed' | 'pending')[] = ['paid', 'paid', 'paid', 'failed', 'pending'];
    const brands = ['visa', 'mastercard', 'amex'];
    const data: BillingHistoryItem[] = [];
    const baseDate = new Date('2025-08-01T00:00:00Z').getTime();

    for (let i = 1; i <= 25; i++) {
        const itemDate = new Date(baseDate + i * 86400000); // add days
        const formattedDate = itemDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

        data.push({
            id: i.toString(),
            date: formattedDate,
            rawDate: itemDate.getTime(),
            description: 'Landowner Pro – Monthly',
            amount: '$49.00',
            status: statuses[i % 5]!,
            cardBrand: brands[i % 3]!,
            cardLast4: (1000 + i).toString(),
        });
    }
    // Return sorted descending initially
    return data.sort((a, b) => b.rawDate - a.rawDate);
};

const ALL_MOCK_DATA = generateMockData();

const billingColumns: ColumnDef<BillingHistoryItem>[] = [
    {
        accessorKey: 'date',
        header: 'Date',
    },
    {
        accessorKey: 'description',
        header: 'Description',
    },
    {
        accessorKey: 'payment',
        header: 'Payment Method',
        cell: ({ row }) => {
            const { cardBrand, cardLast4 } = row.original;
            return (
                <div className="flex items-center gap-2">
                    <span className="capitalize font-medium text-sm">{cardBrand}</span>
                    <span className="text-muted-foreground text-xs font-mono">•••• {cardLast4}</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => <span className="font-semibold">{row.original.amount}</span>,
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
                                    <p>{status === 'failed' ? 'This payment failed. Please check your card details.' : 'This payment is currently being processed.'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                );
            }
            return (
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    Download <Download size={14} />
                </Button>
            );
        },
    },
];

export function BillingHistory() {
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 5 });
    const [statusFilter, setStatusFilter] = React.useState<string>('all');
    const [sortOrder, setSortOrder] = React.useState<string>('desc');

    const filteredData = React.useMemo(() => {
        let result = [...ALL_MOCK_DATA];

        // Filter
        if (statusFilter !== 'all') {
            result = result.filter(item => item.status === statusFilter);
        }

        // Sort
        result.sort((a, b) => {
            if (sortOrder === 'asc') return a.rawDate - b.rawDate;
            return b.rawDate - a.rawDate; // desc
        });

        return result;
    }, [statusFilter, sortOrder]);

    const totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / pagination.pageSize) || 1;
    const paginatedData = filteredData.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize
    );

    // Reset to page 0 when filters change
    React.useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [statusFilter, sortOrder]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Billing History</h2>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowUpDown size={14} /> Sort
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='w-40!' align="end">
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
                                <DropdownMenuRadioItem value="paid">Paid</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="failed">Failed</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <DataTable
                columns={billingColumns}
                data={paginatedData}
                totalPages={totalPages}
                totalRows={totalRows}
                pagination={pagination}
                onPaginationChange={setPagination}
            />
        </div>
    );
}
