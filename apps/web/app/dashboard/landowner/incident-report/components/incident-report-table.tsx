'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Eye, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Ticket, TicketStatus } from '@/app/dashboard/components/incident-report/types';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import { Siren, ShieldAlert, User as UserIcon, Building2 } from 'lucide-react';

interface IncidentReportTableProps {
    data: Ticket[];
    isLoading: boolean;
    baseUrl: string;
    isAdmin?: boolean;
}

export function IncidentReportTable({ data, isLoading, baseUrl, isAdmin }: IncidentReportTableProps) {
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

    const columns: ColumnDef<Ticket>[] = React.useMemo(() => [
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: ({ row }) => {
                const priority = row.original.priority;
                const status = row.original.status;
                if (status === 'resolved') {
                    return <div className="flex items-center gap-2 font-medium"><span className="text-blue-500">🔵</span> Resolved</div>;
                }
                switch (priority) {
                    case 'critical': return <div className="flex items-center gap-2 font-medium"><span className="text-red-500">🔴</span> Critical</div>;
                    case 'high': return <div className="flex items-center gap-2 font-medium"><span className="text-orange-500">🟠</span> High</div>;
                    case 'medium': return <div className="flex items-center gap-2 font-medium"><span className="text-yellow-500">🟡</span> Medium</div>;
                    case 'low': return <div className="flex items-center gap-2 font-medium"><span className="text-green-500">🟢</span> Low</div>;
                    default: return null;
                }
            }
        },
        {
            accessorKey: 'reference',
            header: 'Incident ID',
            cell: ({ row }) => (
                <div className="font-medium text-sm">
                    {row.original.reference}
                </div>
            )
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => {
                const categoryWords = row.original.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1));
                return <div className="text-sm">{categoryWords.join(' ')}</div>;
            }
        },
        {
            accessorKey: 'siteName',
            header: 'Asset',
            cell: ({ row }) => <div className="text-sm">{row.original.siteName}</div>
        },
        {
            accessorKey: 'operatorName',
            header: 'Operator',
            cell: ({ row }) => <div className="text-sm">{row.original.operatorName}</div>
        },
        {
            id: 'severity',
            header: 'Severity',
            cell: ({ row }) => {
                const priority = row.original.priority;
                const capitalized = priority.charAt(0).toUpperCase() + priority.slice(1);
                return <div className="text-sm">{capitalized}</div>;
            }
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                let displayStatus = status.replace(/_/g, ' ');
                displayStatus = displayStatus.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                
                if (status === 'resolved') {
                    displayStatus = 'Closed';
                }
                return (
                    <div className="text-sm">
                        {displayStatus}
                    </div>
                );
            }
        },
        {
            accessorKey: 'updatedAt',
            header: 'Updated',
            cell: ({ row }) => (
                <div className="text-sm">
                    {format(new Date(row.original.updatedAt), 'dd-MM-yyyy HH:mm')}
                </div>
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Action</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <Link href={`${baseUrl}/${row.original.id}`} className="text-sm font-medium hover:underline text-primary">
                        View Case
                    </Link>
                </div>
            )
        }
    ], [baseUrl]);

    return (
        <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden shadow-sm">
            <DataTable
                columns={columns}
                data={data}
                totalRows={data.length}
                totalPages={1}
                pagination={pagination}
                onPaginationChange={setPagination}
                isLoading={isLoading}
            />
        </div>
    );
}
