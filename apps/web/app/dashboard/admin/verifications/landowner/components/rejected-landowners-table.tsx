'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { VerificationRequest } from '@/services/admin.service';

interface RejectedLandownersTableProps {
    data: VerificationRequest[];
    isLoading: boolean;
}

export function RejectedLandownersTable({ data, isLoading }: RejectedLandownersTableProps) {
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

    const columns: ColumnDef<VerificationRequest>[] = [
        {
            accessorKey: 'reviewedAt',
            header: 'Rejected On',
            cell: ({ row }) => (
                <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    {row.original.reviewedAt ? format(new Date(row.original.reviewedAt), 'dd MMM yyyy') : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'userName',
            header: 'Name',
            cell: ({ row }) => <span className="font-semibold">{row.original.userName || 'Unknown User'}</span>,
        },
        {
            accessorKey: 'userEmail',
            header: 'Email',
            cell: ({ row }) => <span className="text-sm">{row.original.userEmail}</span>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant="destructive" className="uppercase text-[9px] font-bold">
                    {row.original.status}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Button size="sm" variant="outline" className="gap-2 h-8 px-3" asChild>
                    <Link href={`/dashboard/admin/verifications/landowner/review/${row.original.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                        Review Dossier
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={data}
            totalPages={Math.ceil(data.length / pagination.pageSize)}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalRows={data.length}
            isLoading={isLoading}
        />
    );
}
