'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table';
import type { SiteVerificationRequest } from '@/services/admin.service';

interface RejectedSitesTableProps {
    data: SiteVerificationRequest[];
    isLoading: boolean;
}

export function RejectedSitesTable({ data, isLoading }: RejectedSitesTableProps) {
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

    const columns = [
        {
            accessorKey: 'reviewedAt',
            header: 'Rejection Date',
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
            accessorKey: 'assetowner',
            header: 'Asset Owner',
            cell: ({ row }: any) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.original.userName || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{row.original.userEmail}</span>
                </div>
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
