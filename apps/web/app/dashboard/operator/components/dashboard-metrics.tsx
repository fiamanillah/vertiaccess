'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Calendar, Clock, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@workspace/ui/components/skeleton'

interface DashboardMetricsProps {
  isLoading: boolean
  metrics: {
    scheduledFlights: number
    pendingApprovals: number
    approvedConsents: number
    actionRequired: number
  }
}

export function DashboardMetrics({ isLoading, metrics }: DashboardMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 shrink-0">
      {/* Scheduled Flights */}
      <Link
        href="/dashboard/operator/bookings"
        className="block transition-all duration-200 hover:scale-[1.005] active:scale-[0.995]"
      >
        <Card className="h-full border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Scheduled flights
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                metrics.scheduledFlights
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Pending Approvals */}
      <Link
        href="/dashboard/operator/bookings"
        className="block transition-all duration-200 hover:scale-[1.005] active:scale-[0.995]"
      >
        <Card className="h-full border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pending approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                metrics.pendingApprovals
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Action Required */}
      <Link
        href="/dashboard/operator/incident-report"
        className="block transition-all duration-200 hover:scale-[1.005] active:scale-[0.995]"
      >
        <Card className="h-full border-border/60 shadow-sm bg-muted/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Action required
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                metrics.actionRequired
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
