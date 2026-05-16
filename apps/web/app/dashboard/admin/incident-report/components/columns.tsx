'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Clock, ArrowRight, Siren, ShieldAlert, User as UserIcon } from 'lucide-react';
import { Ticket } from '@/app/dashboard/components/incident-report/types';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

export const getColumns = (baseUrl: string, isAdmin?: boolean): ColumnDef<Ticket>[] => [
    {
        accessorKey: 'priority',
        header: 'Prio',
        cell: ({ row }) => {
            const priority = row.original.priority;
            return (
                <div className="flex items-center justify-center">
                    {priority === 'critical' ? (
                        <Siren className="h-4 w-4 text-red-600 animate-pulse" />
                    ) : priority === 'high' ? (
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                    ) : (
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    )}
                </div>
            );
        }
    },
    {
        accessorKey: 'reference',
        header: 'Incident ID',
        cell: ({ row }) => (
            <div className="flex flex-col gap-1 py-1">
                <span className="font-mono font-black text-sm text-foreground tracking-tight">
                    {row.original.reference}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    Ref: {row.original.bookingRef}
                </span>
            </div>
        )
    },
    {
        accessorKey: 'category',
        header: 'Subject / Category',
        cell: ({ row }) => (
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-foreground">
                    {row.original.category.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {row.original.description}
                </span>
            </div>
        )
    },
    ...(isAdmin ? [
        {
            id: 'reporter',
            header: 'Reporter',
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        <UserIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold">{row.original.operatorName}</span>
                        <Badge variant="outline" className="text-[7px] h-3 px-1 uppercase tracking-tighter">Operator</Badge>
                    </div>
                </div>
            )
        }
    ] : []),
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status;
            return (
                <Badge
                    className={cn(
                        "text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2",
                        status === 'action_required' ? "bg-red-100 text-red-700" :
                            status === 'under_review' ? "bg-amber-100 text-amber-700" :
                                "bg-muted text-muted-foreground"
                    )}
                >
                    {status.replace(/_/g, ' ')}
                </Badge>
            );
        }
    },
    {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        cell: ({ row }) => (
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(new Date(row.original.updatedAt), 'dd MMM, HH:mm')}
            </div>
        )
    },
    {
        id: 'actions',
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
            <div className="text-right">
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 px-3"
                >
                    <Link href={`${baseUrl}/${row.original.id}`}>
                        View Case
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </Button>
            </div>
        )
    }
];
