'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { RadialProgress } from './SimpleChart'
import { Clock } from 'lucide-react'

interface ApprovalPerformance {
  avgApprovalTime: string
  approvalRate: number
  rejectionRate: number
}

interface ApprovalModeUsage {
  autoApproval: number
  manualApproval: number
}

interface OperationsAnalyticsProps {
  performance: ApprovalPerformance
  modeUsage: ApprovalModeUsage
}

export default function OperationsAnalytics({
  performance,
  modeUsage,
}: OperationsAnalyticsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Approval Performance */}
      <Card className="border-muted/60">
        <CardHeader>
          <CardTitle className="tracking-tight text-lg">Approval Performance</CardTitle>
          <CardDescription>Metrics on Approval Times and Decisions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Average response time badge */}
          <div className="flex items-center gap-4 p-4 border border-muted/50 rounded-xl bg-muted/10">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Average Approval Time
              </span>
              <div className="text-2xl font-bold tracking-tight mt-0.5">
                {performance.avgApprovalTime}
              </div>
            </div>
          </div>

          <div className="flex justify-around items-center gap-4 py-2">
            <div className="flex flex-col items-center gap-2">
              <RadialProgress
                value={performance.approvalRate}
                size={100}
                color="#10b981"
              />
              <span className="text-xs font-semibold text-muted-foreground">Approval Rate</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <RadialProgress
                value={performance.rejectionRate}
                size={100}
                color="#f43f5e"
              />
              <span className="text-xs font-semibold text-muted-foreground">Rejection Rate</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Mode Usage */}
      <Card className="border-muted/60">
        <CardHeader>
          <CardTitle className="tracking-tight text-lg">Approval Mode Usage</CardTitle>
          <CardDescription>Ratios of Automated vs Manual Booking Actions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center h-[calc(100%-70px)] py-4">
          <div className="flex justify-around items-center gap-4 py-2">
            <div className="flex flex-col items-center gap-2">
              <RadialProgress
                value={modeUsage.autoApproval}
                size={110}
                color="#06b6d4"
              />
              <span className="text-xs font-semibold text-muted-foreground">Auto Approval</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <RadialProgress
                value={modeUsage.manualApproval}
                size={110}
                color="#a855f7"
              />
              <span className="text-xs font-semibold text-muted-foreground">Manual Approval</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
