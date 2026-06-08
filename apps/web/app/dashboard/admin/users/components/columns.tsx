'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/format-date';
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import { Loader, MoreHorizontal, UserCheck, ShieldAlert } from 'lucide-react';
import { Badge } from "@workspace/ui/components/badge";
import type { TUser } from './types';
import { toast } from 'sonner';

export const getColumns = (onManage: (user: TUser) => void): ColumnDef<TUser>[] => [
  {
    id: 'avatarUrl',
    accessorKey: 'avatarUrl',
    header: 'Avatar',
    cell: ({ row }) => (
      <Avatar className="h-9 w-9">
        <AvatarImage
          src={row?.original.avatarUrl || ''}
          alt={row?.original.displayName}
        />
        <AvatarFallback className="rounded-lg">
          {row?.original.firstName?.[0] || 'U'}
          {row?.original.lastName?.[0] || ''}
        </AvatarFallback>
      </Avatar>
    ),
  },
  {
    id: 'displayName',
    accessorKey: 'displayName',
    header: 'Name',
    cell: ({ row }) => {
      return (
        <span className="font-medium truncate block max-w-[150px]">
          {row.original.displayName}
        </span>
      );
    },
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <span className="truncate block max-w-[200px]">{row.original.email}</span>
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <Badge variant={row.original.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
        {row.original.role === 'assetmanager' ? 'Asset Manager' : row.original.role}
      </Badge>
    ),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant="outline"
          className={`capitalize flex items-center gap-1 w-fit ${
            status === 'active'
              ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
              : status === 'pending_verification'
              ? 'border-amber-500 text-amber-500 bg-amber-500/10'
              : status === 'suspended'
              ? 'border-red-500 text-red-500 bg-red-500/10'
              : 'border-muted-foreground text-muted-foreground bg-muted'
          }`}
        >
          {status === 'pending_verification' && (
            <Loader className="h-3 w-3 animate-spin" />
          )}
          {status.replace('_', ' ')}
        </Badge>
      );
    },
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(user.id);
                toast.success('User ID copied to clipboard');
              }}
            >
              Copy User ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onManage(user)}>
              <UserCheck className="mr-2 h-4 w-4" />
              Manage Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
