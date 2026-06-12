'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, UserCheck, Clock } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'

interface ReviewHeaderProps {
  name: string
  status: string
}

export function ReviewHeader({ name, status }: ReviewHeaderProps) {
  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4 border-b bg-muted/5">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="hover:bg-accent h-9">
          <Link href="/dashboard/admin/verifications/assetmanager">
            <ChevronLeft className="h-4 w-4 mr-1.5" />
            Back to Queue
          </Link>
        </Button>
        <Separator orientation="vertical" className="hidden sm:block h-6" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              Reviewing Asset Manager: {name}
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium mt-0.5">
              <Clock className="h-3 w-3" /> Registration verification details
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 font-semibold px-2.5 h-6 capitalize"
        >
          {formattedStatus}
        </Badge>
      </div>
    </div>
  )
}
