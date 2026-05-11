'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const needsReviewData = [
    {
        id: '1',
        submissionDate: '2024-05-10',
        name: 'Capt. James Hook',
        email: 'j.hook@skypirates.com',
        licenseId: 'UK-CAA-99231',
        operatorType: 'Commercial',
    },
    {
        id: '2',
        submissionDate: '2024-05-08',
        name: 'Wendy Darling',
        email: 'wendy@neverland-air.io',
        licenseId: 'UK-CAA-11452',
        operatorType: 'Emergency',
    },
];

export function NeedsReviewTable() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 5 });

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const columns = [
        {
            accessorKey: 'submissionDate',
            header: 'Submitted',
            cell: ({ row }: any) => <span className="font-mono text-xs">{row.original.submissionDate}</span>,
        },
        {
            accessorKey: 'name',
            header: 'Operator Name',
            cell: ({ row }: any) => <span className="font-semibold">{row.original.name}</span>,
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }: any) => <span className="text-sm">{row.original.email}</span>,
        },
        {
            accessorKey: 'licenseId',
            header: 'CAA License ID',
            cell: ({ row }: any) => <span className="text-sm font-mono font-bold text-primary">{row.original.licenseId}</span>,
        },
        {
            accessorKey: 'operatorType',
            header: 'Type',
            cell: ({ row }: any) => (
                <Badge variant="outline" className="capitalize">
                    {row.original.operatorType}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: any) => (
                <Button size="sm" variant="outline" className="gap-2" asChild>
                    <Link href={`/dashboard/admin/verifications/operator/review/${row.original.id}`}>
                        <Eye className="h-4 w-4" />
                        Review
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={needsReviewData}
            totalPages={1}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalRows={needsReviewData.length}
            isLoading={isLoading}
        />
    );
}
