'use client'

import * as React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Globe, Clock, Calendar, ArrowRight } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import type { Booking } from '@/services/booking.types'

interface TodaysOperationsCardProps {
  isLoading: boolean
  bookings: Booking[]
  SkeletonListItem: React.ComponentType
}

function toTitleCase(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function TodaysOperationsCard({
  isLoading,
  bookings,
  SkeletonListItem,
}: TodaysOperationsCardProps) {
  const todayBookings = React.useMemo(() => {
    const now = new Date()
    return bookings.filter((b) => {
      const start = new Date(b.startTime)
      return (
        start.getFullYear() === now.getFullYear() &&
        start.getMonth() === now.getMonth() &&
        start.getDate() === now.getDate()
      )
    })
  }, [bookings])

  return (
    <Card className="flex flex-col border-border/60 shadow-md">
      <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold tracking-tight">
              Today's Operations
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {isLoading ? (
          <div className="divide-y divide-border/40">
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </div>
        ) : todayBookings.length > 0 ? (
          <div className="divide-y divide-border/40 max-h-[350px] overflow-y-auto custom-scrollbar">
            {todayBookings.map((booking) => {
              const start = new Date(booking.startTime)
              const end = new Date(booking.endTime)
              const timeStr = `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
              const statusLabel = toTitleCase(booking.status)

              return (
                <div
                  key={booking.id}
                  className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/5"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background shadow-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-none truncate">
                        {toTitleCase(booking.siteName || 'Unknown Site')}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span>
                          {booking.useCategory === 'planned_toal'
                            ? 'Planned TOAL'
                            : 'Emergency Recovery'}
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span>{timeStr}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      className={cn(
                        "text-[9px] uppercase tracking-wider font-bold border-none px-1.5 py-0.5",
                        booking.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                          : booking.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : booking.status === 'ACTIVATED'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                              : booking.status === 'COMPLETED'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                      )}
                    >
                      {statusLabel}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-border/60 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                      asChild
                    >
                      <Link href={`/dashboard/operator/bookings?bookingId=${booking.id}`}>
                        View Details
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[240px]">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
              <Calendar className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No Operations Today
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              No drone operations are scheduled for today.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
