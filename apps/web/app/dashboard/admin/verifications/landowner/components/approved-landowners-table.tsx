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

const approvedData = [
    {
        id: '3',
        approvalDate: '2024-05-01',
        name: 'Sarah Connor',
        email: 's.connor@skyline.com',
        activeSites: 4,
        status: 'active',
    },
    {
        id: '4',
        approvalDate: '2024-04-25',
        name: 'Bruce Wayne',
        email: 'bruce@waynecorp.com',
        activeSites: 12,
        status: 'active',
    },
];

export function ApprovedLandownersTable() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 5 });

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const columns = [
        {
            accessorKey: 'approvalDate',
            header: 'Approved On',
            cell: ({ row }: any) => <span className="font-mono text-xs">{row.original.approvalDate}</span>,
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
            accessorKey: 'activeSites',
            header: 'Active Sites',
            cell: ({ row }: any) => <Badge variant="secondary">{row.original.activeSites}</Badge>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: any) => (
                <Badge className="bg-emerald-100 text-emerald-700 border-none uppercase text-[9px] font-bold">
                    {row.original.status}
                </Badge>
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
                        <DropdownMenuItem onClick={() => toast.info(`Viewing profile for ${row.original.name}`)}>
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
            data={approvedData}
            totalPages={1}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalRows={approvedData.length}
            isLoading={isLoading}
        />
    );
}
