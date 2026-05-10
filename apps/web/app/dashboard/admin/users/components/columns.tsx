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
import { ChevronDown, LinkIcon, Loader, MoreHorizontal } from 'lucide-react';
import { Badge } from "@workspace/ui/components/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import type { TUser } from './types';
import { toast } from 'sonner';

export const columns: ColumnDef<TUser>[] = [
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
          {row?.original.firstName[0]}
          {row?.original.lastName[0]}
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
        {row.original.role}
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
    id: 'instagramUrl',
    accessorKey: 'instagramUrl',
    header: 'Instagram',
    cell: ({ row }) => row.original.instagramUrl ? (
      <a
        href={row.original.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline flex gap-2 items-center text-primary"
      >
        <LinkIcon className="w-4 h-4" /> Instagram
      </a>
    ) : <span className="text-muted-foreground">—</span>,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: 'bio',
    accessorKey: 'bio',
    header: 'Bio',
    cell: ({ row }) => {
      const bio = row.original.bio || '—';

      if (bio === '—' || bio.length < 30) {
        return <span className="truncate block max-w-[150px]">{bio}</span>;
      }

      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto justify-start text-left text-sm p-0 hover:bg-transparent"
            >
              <span className="flex items-center gap-1 text-primary">
                {bio.slice(0, 20)}...
                <ChevronDown size={14} />
              </span>
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-80 p-4" align="start">
            <ScrollArea className="h-32">
              <p className="text-sm whitespace-pre-wrap">{bio}</p>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      );
    },
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
            <DropdownMenuItem onClick={() => toast.info('Edit functionality coming soon')}>
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => toast.error('Delete functionality coming soon')}>
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
