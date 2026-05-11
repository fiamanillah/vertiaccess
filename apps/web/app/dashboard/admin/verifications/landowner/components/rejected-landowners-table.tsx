'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table';
import { Badge } from '@workspace/ui/components/badge';

const rejectedData = [
    {
        id: '5',
        rejectionDate: '2024-05-05',
        name: 'Arthur Dent',
        email: 'arthur.d@prefect.com',
        reason: 'Illegible business documents',
    },
];

export function RejectedLandownersTable() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 5 });

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const columns = [
        {
            accessorKey: 'rejectionDate',
            header: 'Rejected On',
            cell: ({ row }: any) => <span className="font-mono text-xs">{row.original.rejectionDate}</span>,
        },
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }: any) => <span className="font-semibold">{row.original.name}</span>,
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }: any) => <span className="text-sm">{row.original.email}</span>,
        },
        {
            accessorKey: 'reason',
            header: 'Reason',
            cell: ({ row }: any) => <span className="text-xs text-destructive font-medium">{row.original.reason}</span>,
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
