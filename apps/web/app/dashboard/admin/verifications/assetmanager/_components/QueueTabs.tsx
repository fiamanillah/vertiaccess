'use client'

import * as React from 'react'
import {
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Badge } from '@workspace/ui/components/badge'
import { Skeleton } from '@workspace/ui/components/skeleton'

interface QueueTabsProps {
  activeTab: string
  onTabChange: (value: string) => void
  counts: {
    PENDING: number
    APPROVED: number
    REJECTED: number
  }
  isLoading: boolean
}

export function QueueTabs({
  activeTab,
  onTabChange,
  counts,
  isLoading,
}: QueueTabsProps) {
  const renderBadge = (count: number, active: boolean, variant: 'primary' | 'outline') => {
    if (isLoading && count === 0) {
      return <Skeleton className="ml-2 h-4 w-6 rounded-full" />
    }
    if (count === 0) return null

    if (variant === 'primary') {
      return (
        <Badge className="ml-2 bg-primary text-primary-foreground h-5 min-w-5 px-1 flex items-center justify-center rounded-full text-[10px] font-semibold">
          {count}
        </Badge>
      )
    }

    return (
      <Badge
        variant="outline"
        className="ml-2 h-5 min-w-5 px-1 flex items-center justify-center rounded-full text-[10px] font-semibold border-muted-foreground/30 text-muted-foreground"
      >
        {count}
      </Badge>
    )
  }

  return (
    <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
      <TabsTrigger value="needs-review" className="relative text-xs sm:text-sm">
        Needs Review
        {renderBadge(counts.PENDING, activeTab === 'needs-review', 'primary')}
      </TabsTrigger>
      <TabsTrigger value="approved" className="text-xs sm:text-sm">
        Approved
        {renderBadge(counts.APPROVED, activeTab === 'approved', 'outline')}
      </TabsTrigger>
      <TabsTrigger value="rejected" className="text-xs sm:text-sm">
        Rejected
        {renderBadge(counts.REJECTED, activeTab === 'rejected', 'outline')}
      </TabsTrigger>
    </TabsList>
  )
}
