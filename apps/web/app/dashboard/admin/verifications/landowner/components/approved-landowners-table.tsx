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

interface ApprovedLandownersTableProps {
    data: VerificationRequest[];
    isLoading: boolean;
}

export function ApprovedLandownersTable({ data, isLoading }: ApprovedLandownersTableProps) {
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

    const columns: ColumnDef<VerificationRequest>[] = [
        {
            accessorKey: 'reviewedAt',
            header: 'Approved On',
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
            accessorKey: 'userOrganisation',
            header: 'Organisation',
            cell: ({ row }) => <span className="text-sm">{row.original.userOrganisation || '—'}</span>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge className="bg-emerald-100 text-emerald-700 border-none uppercase text-[9px] font-bold">
                    {row.original.status}
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
                            <Link href={`/dashboard/admin/verifications/landowner/review/${row.original.id}`}>
                                View Dossier
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info(`Viewing profile for ${row.original.userName}`)}>
                            View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>Manage Sites</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Suspend Account</DropdownMenuItem>
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
