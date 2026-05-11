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
        siteName: 'Canary Wharf North Pad',
        siteType: 'toal',
        landowner: { name: 'Alex Rivera', email: 'alex@canarywharf.com' },
    },
    {
        id: '2',
        submissionDate: '2024-05-09',
        siteName: 'Surrey Emergency Recovery',
        siteType: 'emergency',
        landowner: { name: 'Sarah Jenkins', email: 'sarah.j@surreyfarms.co.uk' },
    },
    {
        id: '3',
        submissionDate: '2024-05-08',
        siteName: 'Birmingham Central Vertiport',
        siteType: 'toal',
        landowner: { name: 'James Wilson', email: 'james.wilson@birmingham.gov' },
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
            header: 'Submission Date',
            cell: ({ row }: any) => <span className="font-mono text-xs">{row.original.submissionDate}</span>,
        },
        {
            accessorKey: 'siteName',
            header: 'Site Name',
            cell: ({ row }: any) => <span className="font-semibold">{row.original.siteName}</span>,
        },
        {
            accessorKey: 'siteType',
            header: 'Primary Type',
            cell: ({ row }: any) => (
                <Badge variant="outline" className="capitalize">
                    {row.original.siteType}
                </Badge>
            ),
        },
        {
            accessorKey: 'landowner',
            header: 'Landowner',
            cell: ({ row }: any) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.original.landowner.name}</span>
                    <span className="text-xs text-muted-foreground">{row.original.landowner.email}</span>
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
            data={needsReviewData}
            totalPages={1}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalRows={needsReviewData.length}
            isLoading={isLoading}
        />
    );
}
