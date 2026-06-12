'use client'

import * as React from 'react'
import { Loader2, RefreshCcw } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'

interface QueueHeaderProps {
  isLoading: boolean
  onRefresh: () => void
}

export function QueueHeader({ isLoading, onRefresh }: QueueHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Asset Manager Verification Queue
        </h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject asset owner registration requests.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="gap-2 h-9 px-3 w-full sm:w-auto"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCcw className="h-4 w-4" />
        )}
        Refresh
      </Button>
    </div>
  )
}
