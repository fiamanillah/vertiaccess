import * as React from 'react'
import { Skeleton } from '@workspace/ui/components/skeleton'

export function ReviewSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-60px)] w-full">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border/40 bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[60%] h-full relative">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="w-[40%] h-full border-l border-border/40 p-5 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
