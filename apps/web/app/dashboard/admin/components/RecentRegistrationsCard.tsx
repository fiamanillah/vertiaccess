'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Calendar } from 'lucide-react'

interface RecentRegistrationsCardProps {
  newAssetManagers30d: number
  newOperators30d: number
  newSites30d: number
}

export default function RecentRegistrationsCard({
  newAssetManagers30d,
  newOperators30d,
  newSites30d,
}: RecentRegistrationsCardProps) {
  return (
    <Card className="transition-all duration-300 hover:shadow-md backdrop-blur-sm bg-card/40 border border-indigo-500/20 hover:border-indigo-500/40">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-tight text-foreground/80 uppercase">Recent Registrations</CardTitle>
          <Calendar className="h-4 w-4 text-indigo-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-1 pb-5 px-5 text-xs">
        {/* Item 1: Asset Managers */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-500/10 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors duration-200">
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground/90 block">New Asset Managers</span>
            <span className="text-[9px] text-muted-foreground uppercase font-semibold">Last 30 Days</span>
          </div>
          <span className="font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            {newAssetManagers30d}
          </span>
        </div>

        {/* Item 2: Operators */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-500/10 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors duration-200">
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground/90 block">New Operators</span>
            <span className="text-[9px] text-muted-foreground uppercase font-semibold">Last 30 Days</span>
          </div>
          <span className="font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            {newOperators30d}
          </span>
        </div>

        {/* Item 3: Sites */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-500/10 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors duration-200">
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground/90 block">New Sites Added</span>
            <span className="text-[9px] text-muted-foreground uppercase font-semibold">Last 30 Days</span>
          </div>
          <span className="font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            {newSites30d}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
