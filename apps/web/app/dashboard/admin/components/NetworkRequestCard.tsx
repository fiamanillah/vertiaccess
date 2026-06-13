'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { FileText } from 'lucide-react'

interface NetworkRequestCardProps {
  submitted: number
  approved: number
  rejected: number
}

export default function NetworkRequestCard({
  submitted,
  approved,
  rejected,
}: NetworkRequestCardProps) {
  const approvalRate = submitted > 0 ? ((approved / submitted) * 100).toFixed(0) : '0'
  const rejectionRate = submitted > 0 ? ((rejected / submitted) * 100).toFixed(0) : '0'
  const pendingCount = Math.max(0, submitted - approved - rejected)
  const pendingRate = submitted > 0 ? ((pendingCount / submitted) * 100).toFixed(0) : '0'

  return (
    <Card className="transition-all duration-300 hover:shadow-md backdrop-blur-sm bg-card/40 border border-emerald-500/20 hover:border-emerald-500/40">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-tight text-foreground/80 uppercase">Network Request</CardTitle>
          <FileText className="h-4 w-4 text-emerald-500" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-1 pb-5 px-5">
        {/* Metric list */}
        <div className="grid grid-cols-3 gap-1 divide-x divide-border/40 text-center">
          <div className="px-1">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground">Submitted</span>
            <span className="text-base font-black text-foreground">{submitted}</span>
          </div>
          <div className="px-1">
            <span className="block text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Approved</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{approved}</span>
          </div>
          <div className="px-1">
            <span className="block text-[10px] uppercase font-bold text-red-500">Rejected</span>
            <span className="text-base font-black text-red-500">{rejected}</span>
          </div>
        </div>

        {/* Segmented bar with green and red */}
        <div className="space-y-1.5">
          <div className="h-1.5 w-full bg-muted/65 rounded-full overflow-hidden flex">
            {approved > 0 && (
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${approvalRate}%` }}
              />
            )}
            {rejected > 0 && (
              <div 
                className="h-full bg-red-500 transition-all duration-500" 
                style={{ width: `${rejectionRate}%` }}
              />
            )}
            {pendingCount > 0 && (
              <div 
                className="h-full bg-muted-foreground/35 transition-all duration-500" 
                style={{ width: `${pendingRate}%` }}
              />
            )}
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{approvalRate}% Approved</span>
            {pendingCount > 0 && <span>{pendingCount} Pending</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
