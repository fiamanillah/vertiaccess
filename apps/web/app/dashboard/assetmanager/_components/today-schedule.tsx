'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Button } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Globe, Clock, ArrowRight, Calendar } from 'lucide-react'
import { bookingService } from '@/services/booking.service'

interface ScheduleItem {
  id: string
  time: string
  operator: string
  type: string
  hasCertificate: boolean
}

function SkeletonListItem() {
  return (
    <div className="flex items-center justify-between gap-4 p-5 border-b border-border/40 last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <div className="space-y-2 w-full max-w-[12.5rem]">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-8 w-24 rounded-md shrink-0" />
    </div>
  )
}

export function TodaySchedule() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [todaySchedule, setTodaySchedule] = React.useState<ScheduleItem[]>([])

  React.useEffect(() => {
    let mounted = true

    async function loadTodaySchedule() {
      try {
        setIsLoading(true)

        const upcomingBookingsRes = await bookingService
          .listAssetManagerBookings({
            bucket: 'upcoming',
            limit: 20,
          })
          .catch(() => ({ success: false, data: [] }))

        if (!mounted) return

        const now = new Date()
        const todayItems: ScheduleItem[] = []

        // Today Schedule: from upcoming bookings
        for (const b of upcomingBookingsRes?.data || []) {
          const start = new Date(b.startTime)
          const end = new Date(b.endTime)
          const isToday =
            start.getFullYear() === now.getFullYear() &&
            start.getMonth() === now.getMonth() &&
            start.getDate() === now.getDate()

          if (isToday) {
            todayItems.push({
              id: b.id,
              time: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
              operator: b.operatorName || 'Operator',
              type:
                b.useCategory === 'planned_toal'
                  ? 'Planned TOAL'
                  : 'Emergency and recovery',
              hasCertificate: true,
            })
          }
        }

        setTodaySchedule(todayItems)
      } catch (error) {
        console.error('Failed to load today schedule', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadTodaySchedule()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <Card className="flex flex-col border-border/60 shadow-md">
      <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold tracking-tight">
                Today's operations
              </CardTitle>
              <CardDescription className="text-xs font-normal text-muted-foreground">
                Real-time Access & Activity Ledger
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-border/60 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
            asChild
          >
            <Link href="/dashboard/assetmanager/scheduler">
              View Operations
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {isLoading ? (
          <div className="divide-y divide-border/40">
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </div>
        ) : todaySchedule.length > 0 ? (
          <div className="divide-y divide-border/40">
            {todaySchedule.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/5"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background shadow-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-none truncate">
                      {item.operator}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{item.type}</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-border/60 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    asChild
                  >
                    <Link href={`/dashboard/assetmanager/scheduler`}>
                      View Details
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[15rem]">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
              <Calendar className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No flights today
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[15rem]">
              No drone operations are scheduled for your properties today.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
