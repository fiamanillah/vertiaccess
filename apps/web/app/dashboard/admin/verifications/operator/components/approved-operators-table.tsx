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
import Link from 'next/link';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { VerificationRequest } from '@/services/admin.service';

interface ApprovedOperatorsTableProps {
    data: VerificationRequest[];
    isLoading: boolean;
}

export function ApprovedOperatorsTable({ data, isLoading }: ApprovedOperatorsTableProps) {
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

    const columns: ColumnDef<VerificationRequest>[] = [
        {
            accessorKey: 'reviewedAt',
            header: 'Approved On',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {row.original.reviewedAt ? format(new Date(row.original.reviewedAt), 'dd MMM yyyy') : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'userName',
            header: 'Operator',
            cell: ({ row }) => <span className="font-semibold">{row.original.userName}</span>,
        },
        {
            accessorKey: 'userEmail',
            header: 'Email',
            cell: ({ row }) => <span className="text-sm">{row.original.userEmail}</span>,
        },
        {
            accessorKey: 'userOrganisation',
            header: 'Organisation',
            cell: ({ row }) => <span className="text-sm">{row.original.userOrganisation || '—'}</span>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold px-2.5 py-0.5 h-6">
                    {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1).toLowerCase()}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/admin/verifications/operator/review/${row.original.id}`}>
                                View Dossier
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info(`Viewing profile for ${row.original.userName}`)}>
                            View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>View Flight Logs</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Revoke License</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
