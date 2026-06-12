'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/format-date';
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Loader, UserCheck } from 'lucide-react';
import { Badge } from "@workspace/ui/components/badge";
import type { TUser } from './types';

export const getColumns = (onManage: (user: TUser) => void): ColumnDef<TUser>[] => [
  {
    id: 'fullName',
    accessorKey: 'displayName',
    header: 'Full Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border border-border/50">
          <AvatarImage
            src={row.original.avatarUrl || ''}
            alt={row.original.displayName}
          />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-xs">
            {row.original.firstName?.[0] || 'U'}
            {row.original.lastName?.[0] || ''}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-foreground truncate block max-w-[150px]">
          {row.original.displayName}
        </span>
      </div>
    ),
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.original.role;
      const displayRole =
        role === 'assetmanager'
          ? 'Asset Owner'
          : role === 'operator'
          ? 'Operator'
          : role === 'admin'
          ? 'Admin'
          : role;

      return (
        <Badge
          variant={role === 'admin' ? 'destructive' : role === 'assetmanager' ? 'default' : 'secondary'}
          className="capitalize font-medium"
        >
          {displayRole}
        </Badge>
      );
    },
  },
  {
    id: 'organisation',
    accessorKey: 'organisation',
    header: 'Organisation',
    cell: ({ row }) => (
      <span className="truncate block max-w-[150px] text-muted-foreground font-medium">
        {row.original.organisation || 'N/A'}
      </span>
    ),
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="truncate block max-w-[200px] text-muted-foreground font-mono text-xs">
        {row.original.email}
      </span>
    ),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Account Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant="outline"
          className={`capitalize flex items-center gap-1 w-fit font-medium ${
            status === 'active'
              ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
              : status === 'pending_verification'
              ? 'border-amber-500 text-amber-500 bg-amber-500/10'
              : status === 'suspended'
              ? 'border-red-500 text-red-500 bg-red-500/10'
              : status === 'payment_locked'
              ? 'border-orange-500 text-orange-500 bg-orange-500/10'
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
    id: 'lastLogin',
    accessorKey: 'lastLogin',
    header: 'Last Login',
    cell: ({ row }) => {
      const lastLogin = row.original.lastLogin;
      return lastLogin ? (
        <span className="text-muted-foreground font-medium text-xs">
          {formatDate(lastLogin)}
        </span>
      ) : (
        <span className="text-muted-foreground/60 italic text-xs">Never logged in</span>
      );
    },
  },
  {
    id: 'actions',
    header: 'Action',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Avoid triggering table row click twice
            onManage(user);
          }}
          className="flex items-center gap-1.5 border-primary/20 hover:border-primary/50 text-xs font-semibold hover:bg-primary/5 transition-all duration-200"
        >
          <UserCheck className="h-3.5 w-3.5 text-primary" />
          <span>Manage Account</span>
        </Button>
      );
    },
  },
];
