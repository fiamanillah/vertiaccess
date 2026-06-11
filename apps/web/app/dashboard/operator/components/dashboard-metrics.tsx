'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { CheckCircle2, Calendar, AlertCircle } from 'lucide-react'

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
      {/* Approved Request */}
      <Link
        href="/dashboard/operator/bookings"
        className="block transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
      >
        <Card className="h-full border-border/60 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 border-l-4 border-l-emerald-500/80 bg-gradient-to-br from-card to-muted/20 pt-2 pb-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Approved Request
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                metrics.approvedConsents
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Upcoming Mission */}
      <Link
        href="/dashboard/operator/bookings"
        className="block transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
      >
        <Card className="h-full border-border/60 shadow-sm hover:shadow-md hover:border-indigo-500/40 transition-all duration-300 border-l-4 border-l-indigo-500/80 bg-gradient-to-br from-card to-muted/20 pt-2 pb-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Upcoming Mission
            </CardTitle>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                metrics.scheduledFlights
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Action Required */}
      <Link
        href="/dashboard/operator/incident-report"
        className="block transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
      >
        <Card className={cn(
          "h-full border-border/60 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 bg-gradient-to-br from-card to-muted/20 pt-2 pb-3",
          metrics.actionRequired > 0 
            ? "border-l-rose-500/90 hover:border-rose-500/40 bg-rose-500/[0.01]" 
            : "border-l-muted-foreground/30 hover:border-border/80"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Action Required
            </CardTitle>
            <div className="flex items-center gap-2">
              <AlertCircle className={cn(
                "h-4 w-4",
                metrics.actionRequired > 0 ? "text-rose-500" : "text-muted-foreground"
              )} />
              {!isLoading && metrics.actionRequired > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold tracking-tight",
              metrics.actionRequired > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
            )}>
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
