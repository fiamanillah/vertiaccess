'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@workspace/ui/lib/utils';

const approvedData = [
    {
        id: '4',
        approvalDate: '2024-05-01',
        siteName: 'London Heliport Alpha',
        accessFee: 125.00,
        status: 'live',
    },
    {
        id: '5',
        approvalDate: '2024-04-28',
        siteName: 'Manchester Hub One',
        accessFee: 85.00,
        status: 'paused',
    },
];

export function ApprovedSitesTable() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 5 });

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const columns = [
        {
            accessorKey: 'approvalDate',
            header: 'Approval Date',
            cell: ({ row }: any) => <span className="font-mono text-xs">{row.original.approvalDate}</span>,
        },
        {
            accessorKey: 'siteName',
            header: 'Site Name',
            cell: ({ row }: any) => <span className="font-semibold">{row.original.siteName}</span>,
        },
        {
            accessorKey: 'accessFee',
            header: 'Access Fee',
            cell: ({ row }: any) => <span className="font-mono">£{row.original.accessFee.toFixed(2)}</span>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: any) => (
                <Badge className={cn(
                    "border-none",
                    row.original.status === 'live' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                )}>
                    {row.original.status.toUpperCase()}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: any) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => toast.info(`Viewing details for ${row.original.siteName}`)}>
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-amber-600">Pause Site</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Revoke Approval</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={approvedData}
            totalPages={1}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalRows={approvedData.length}
            isLoading={isLoading}
        />
    );
}
