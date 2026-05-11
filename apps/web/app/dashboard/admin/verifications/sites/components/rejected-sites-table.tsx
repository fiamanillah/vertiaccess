'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table';

const rejectedData = [
    {
        id: '6',
        rejectionDate: '2024-05-05',
        siteName: 'Bristol Rooftop Pad',
        reason: 'Insufficient safety clearances',
        landowner: 'Mark Thompson',
    },
];

export function RejectedSitesTable() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 5 });

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const columns = [
        {
            accessorKey: 'rejectionDate',
            header: 'Rejection Date',
            cell: ({ row }: any) => <span className="font-mono text-xs">{row.original.rejectionDate}</span>,
        },
        {
            accessorKey: 'siteName',
            header: 'Site Name',
            cell: ({ row }: any) => <span className="font-semibold">{row.original.siteName}</span>,
        },
        {
            accessorKey: 'reason',
            header: 'Reason',
            cell: ({ row }: any) => <span className="text-xs text-red-600 font-medium">{row.original.reason}</span>,
        },
        {
            accessorKey: 'landowner',
            header: 'Landowner',
            cell: ({ row }: any) => <span className="text-sm">{row.original.landowner}</span>,
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={rejectedData}
            totalPages={1}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalRows={rejectedData.length}
            isLoading={isLoading}
        />
    );
}
