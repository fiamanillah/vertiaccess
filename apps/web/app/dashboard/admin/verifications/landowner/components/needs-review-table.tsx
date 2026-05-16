'use client'

import * as React from 'react'
import { DataTable } from '@/components/data-table'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Eye } from 'lucide-react'
import Link from 'next/link'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { VerificationRequest } from '@/services/admin.service'

interface NeedsReviewTableProps {
  data: VerificationRequest[]
  isLoading: boolean
}

export function NeedsReviewTable({ data, isLoading }: NeedsReviewTableProps) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const columns: ColumnDef<VerificationRequest>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Submitted',
      cell: ({ row }) => (
        <span className="font-mono text-[10px] text-muted-foreground uppercase">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy')}
        </span>
      ),
    },
    {
      accessorKey: 'userName',
      header: 'Full Name',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold">
            {row.original.userName || 'Unknown User'}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {row.original.userId.slice(0, 8)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'userEmail',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.userEmail}</span>
      ),
    },
    {
      accessorKey: 'userOrganisation',
      header: 'Company / Estate',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.userOrganisation || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'submittedDocuments',
      header: 'Docs',
      cell: ({ row }) => {
        const docs = row.original.submittedDocuments
        return (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {docs && docs.length > 0 ? docs[0].type || 'Identity' : 'Pending'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button size="sm" variant="outline" className="gap-2 h-8 px-3" asChild>
          <Link
            href={`/dashboard/admin/verifications/landowner/review/${row.original.id}`}
          >
            <Eye className="h-3.5 w-3.5" />
            Review
          </Link>
        </Button>
      ),
    },
  ]

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
  )
}
