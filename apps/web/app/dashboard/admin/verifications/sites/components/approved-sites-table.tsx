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
import type { SiteVerificationRequest } from '@/services/admin.service';

interface ApprovedSitesTableProps {
    data: SiteVerificationRequest[];
    isLoading: boolean;
}

export function ApprovedSitesTable({ data, isLoading }: ApprovedSitesTableProps) {
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

    const columns = [
        {
            accessorKey: 'reviewedAt',
            header: 'Approval Date',
            cell: ({ row }: any) => <span className="font-mono text-xs">{row.original.reviewedAt ? new Date(row.original.reviewedAt).toLocaleDateString() : 'N/A'}</span>,
        },
        {
            accessorKey: 'siteName',
            header: 'Site Name',
            cell: ({ row }: any) => <span className="font-semibold">{row.original.siteName || 'N/A'}</span>,
        },
        {
            accessorKey: 'siteReference',
            header: 'Site Ref',
            cell: ({ row }: any) => <span className="font-mono text-xs text-muted-foreground">{row.original.siteReference || 'N/A'}</span>,
        },
        {
            accessorKey: 'assetmanager',
            header: 'Asset Manager',
            cell: ({ row }: any) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.original.userName || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{row.original.userEmail}</span>
                </div>
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
            data={data}
            totalPages={1}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalRows={data.length}
            isLoading={isLoading}
        />
    );
}
