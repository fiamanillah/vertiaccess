'use client'

import * as React from 'react'
import { DataTable } from '@/components/data-table'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { MoreHorizontal, Copy, FileText, ExternalLink } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { toast } from 'sonner'
import Link from 'next/link'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { VerificationRequest } from '@/services/admin.service'

interface ApprovedTableProps {
  data: VerificationRequest[]
  isLoading: boolean
  totalPages: number
  totalRows: number
  pagination: { pageIndex: number; pageSize: number }
  onPaginationChange: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >
}

export function ApprovedTable({
  data,
  isLoading,
  totalPages,
  totalRows,
  pagination,
  onPaginationChange,
}: ApprovedTableProps) {
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    const isVaId = id.toLowerCase().startsWith('va-')
    toast.success(isVaId ? 'Asset Manager VA ID copied to clipboard' : 'Asset Manager ID copied to clipboard')
  }

  const columns: ColumnDef<VerificationRequest>[] = [
    {
      accessorKey: 'userId',
      header: 'Asset Manager ID',
      cell: ({ row }) => {
        const displayId = row.original.userVaId || row.original.userId
        const isVaId = !!row.original.userVaId
        const displayText = isVaId ? displayId : displayId.slice(0, 8)
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span className="uppercase">{displayText}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 hover:text-foreground shrink-0"
              onClick={() => handleCopyId(displayId)}
            >
              <Copy className="h-2.5 w-2.5" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: 'userName',
      header: 'Full Name',
      cell: ({ row }) => (
        <span className="font-semibold text-sm">
          {row.original.userName || 'Unknown User'}
        </span>
      ),
    },
    {
      accessorKey: 'userOrganisation',
      header: 'Organisation',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.userOrganisation || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'userEmail',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.userEmail}</span>
      ),
    },
    {
      accessorKey: 'submittedDocuments',
      header: 'Identification Doc',
      cell: ({ row }) => {
        const docs = row.original.submittedDocuments
        if (!docs || docs.length === 0) {
          return <span className="text-muted-foreground text-xs italic">None Provided</span>
        }
        return (
          <div className="flex flex-col gap-1 max-w-[200px]">
            {docs.map((doc: any, index: number) => {
              const docName = doc.fileName || doc.fileKey?.split('/').pop() || `Document ${index + 1}`
              const docType = doc.documentType?.replace(/_/g, ' ') || 'Identity Document'
              const formattedType = docType.charAt(0).toUpperCase() + docType.slice(1).toLowerCase()
              return (
                <a
                  key={index}
                  href={doc.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate max-w-[120px]" title={docName}>{formattedType}</span>
                  <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-55" />
                </a>
              )
            })}
          </div>
        )
      },
    },
    {
      accessorKey: 'accountStatus',
      header: 'Account Status',
      cell: ({ row }) => {
        const status = row.original.accountStatus || 'VERIFIED'
        const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ')
        
        let badgeClass = "bg-emerald-100 text-emerald-700 border-none text-xs font-semibold px-2.5 py-0.5 h-6 capitalize"
        if (status === 'UNVERIFIED') {
          badgeClass = "bg-amber-100 text-amber-700 border-none text-xs font-semibold px-2.5 py-0.5 h-6 capitalize"
        } else if (status === 'SUSPENDED' || status === 'BANNED') {
          badgeClass = "bg-rose-100 text-rose-700 border-none text-xs font-semibold px-2.5 py-0.5 h-6 capitalize"
        } else if (status === 'PAYMENT_LOCKED') {
          badgeClass = "bg-orange-100 text-orange-700 border-none text-xs font-semibold px-2.5 py-0.5 h-6 capitalize"
        }

        return (
          <Badge className={badgeClass} variant="outline">
            {formattedStatus}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Submitted Date & Time',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy, HH:mm')}
        </span>
      ),
    },
    {
      accessorKey: 'reviewedAt',
      header: 'Approved Date',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
          {row.original.reviewedAt ? format(new Date(row.original.reviewedAt), 'dd MMM yyyy, HH:mm') : '—'}
        </span>
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
              <Link href={`/dashboard/admin/verifications/assetmanager/review/${row.original.id}`}>
                View Verification
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
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      totalPages={totalPages}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      totalRows={totalRows}
      isLoading={isLoading}
    />
  )
}
