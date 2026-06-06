'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, UserCheck, Clock } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'

interface ReviewHeaderProps {
  name: string
}

export function ReviewHeader({ name }: ReviewHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b bg-muted/5">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="hover:bg-accent">
          <Link href="/dashboard/admin/verifications/assetmanager">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Queue
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              Reviewing Asset Manager: {name}
            </h1>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-widest font-bold">
              <Clock className="h-3 w-3" /> Registered 3 days ago
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 font-bold uppercase tracking-widest text-[9px] px-2 h-6"
        >
          Verification Pending
        </Badge>
      </div>
    </div>
  )
}
