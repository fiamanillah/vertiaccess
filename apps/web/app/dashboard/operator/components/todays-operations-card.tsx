'use client'

import * as React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { ArrowRight } from 'lucide-react'
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
    <Card className="flex flex-col border-border/60 shadow-md pt-2 pb-0">
      <CardHeader className="border-b border-border/40 bg-muted/30 py-4 px-5">
        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
          Today's Operations
        </CardTitle>
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
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/5 border-l-2 border-transparent hover:border-indigo-500/50"
                >
                  <div className="flex flex-col gap-1.5 min-w-0">
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
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-border/60 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                      asChild
                    >
                      <Link href={`/dashboard/operator/bookings?bookingId=${booking.id}`} title="View Details">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[240px]">
            <div className="mb-3 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
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
