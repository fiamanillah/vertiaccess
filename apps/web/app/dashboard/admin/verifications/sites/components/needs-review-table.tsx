'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import type { SiteVerificationRequest } from '@/services/admin.service';

interface NeedsReviewTableProps {
    data: SiteVerificationRequest[];
    isLoading: boolean;
}

export function NeedsReviewTable({ data, isLoading }: NeedsReviewTableProps) {
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

    const columns = [
        {
            accessorKey: 'createdAt',
            header: 'Submission Date',
            cell: ({ row }: any) => <span className="font-mono text-xs">{new Date(row.original.createdAt).toLocaleDateString()}</span>,
        },
        {
            accessorKey: 'siteName',
            header: 'Site Name',
            cell: ({ row }: any) => <span className="font-semibold">{row.original.siteName || 'N/A'}</span>,
        },
        {
            accessorKey: 'siteReference',
            header: 'Site Ref',
            cell: ({ row }: any) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {row.original.siteReference || 'N/A'}
                </span>
            ),
        },
        {
            accessorKey: 'landowner',
            header: 'Asset Owner',
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
                <Button size="sm" variant="outline" className="gap-2" asChild>
                    <Link href={`/dashboard/admin/verifications/sites/review/${row.original.id}`}>
                        <Eye className="h-4 w-4" />
                        Review Site
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={data}
            totalPages={1} // Handled by server pagination wrapper
            pagination={pagination}
            onPaginationChange={setPagination}
            totalRows={data.length}
            isLoading={isLoading}
        />
    );
}
