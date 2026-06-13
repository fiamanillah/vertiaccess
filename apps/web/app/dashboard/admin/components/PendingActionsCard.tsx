'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { AlertCircle } from 'lucide-react'

interface PendingActionsCardProps {
  pendingAssetManagers: number
  pendingOperators: number
  pendingAssetReviews: number
}

export default function PendingActionsCard({
  pendingAssetManagers,
  pendingOperators,
  pendingAssetReviews,
}: PendingActionsCardProps) {
  return (
    <Card className="transition-all duration-300 hover:shadow-md backdrop-blur-sm bg-card/40 border border-amber-500/20 hover:border-amber-500/40">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-tight text-foreground/80 uppercase">Pending Actions</CardTitle>
          <AlertCircle className="h-4 w-4 text-amber-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-1 pb-5 px-5">
        {/* Asset Manager Verifications */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 transition-colors duration-200">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-foreground/90">Pending Asset Managers</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
            {pendingAssetManagers}
          </span>
        </div>

        {/* Operator Verifications */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 transition-colors duration-200">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-foreground/90">Pending Operators</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
            {pendingOperators}
          </span>
        </div>

        {/* Asset Reviews */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 transition-colors duration-200">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-foreground/90">Pending Asset Reviews</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
            {pendingAssetReviews}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
