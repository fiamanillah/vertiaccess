'use client'

import * as React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card'
import { Button } from '@workspace/ui/components/button'
import { ArrowRight, Bell, FileText, CheckCircle2, XCircle, Ban, Activity } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import type { Booking } from '@/services/booking.types'

interface ActionInboxCardProps {
  isLoading: boolean
  bookings: Booking[]
  SkeletonListItem: React.ComponentType
}

interface ActivityItem {
  id: string
  bookingId: string
  timestamp: Date
  title: string
  description: string
  reference: string
  status: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
}

export function ActionInboxCard({
  isLoading,
  bookings,
  SkeletonListItem,
}: ActionInboxCardProps) {
  const activities = React.useMemo(() => {
    const list: ActivityItem[] = []

    bookings.forEach((b) => {
      // 1. Creation
      if (b.createdAt) {
        list.push({
          id: `${b.id}-created`,
          bookingId: b.id,
          timestamp: new Date(b.createdAt),
          title: 'Mission Request Submitted',
          description: `Requested a ${b.useCategory === 'emergency_recovery' ? 'Emergency Recovery' : 'Planned TOAL'} mission at ${b.siteName || 'Unknown Site'}.`,
          reference: b.bookingReference,
          status: 'PENDING',
          icon: FileText,
          iconBg: 'bg-amber-100 dark:bg-amber-950/40',
          iconColor: 'text-amber-600 dark:text-amber-400',
        })
      }

      // 2. Responded (Approved / Rejected)
      if (b.respondedAt && (b.status === 'APPROVED' || b.status === 'REJECTED')) {
        const isApproved = b.status === 'APPROVED'
        list.push({
          id: `${b.id}-responded`,
          bookingId: b.id,
          timestamp: new Date(b.respondedAt),
          title: isApproved ? 'Mission Approved' : 'Mission Rejected',
          description: isApproved
            ? `Mission request for ${b.siteName || 'Unknown Site'} has been approved.`
            : `Mission request for ${b.siteName || 'Unknown Site'} was rejected.${b.adminNote ? ` Reason: ${b.adminNote}` : ''}`,
          reference: b.bookingReference,
          status: b.status,
          icon: isApproved ? CheckCircle2 : XCircle,
          iconBg: isApproved ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-red-100 dark:bg-red-950/40',
          iconColor: isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        })
      }

      // 3. Cancelled
      if (b.cancelledAt) {
        list.push({
          id: `${b.id}-cancelled`,
          bookingId: b.id,
          timestamp: new Date(b.cancelledAt),
          title: 'Mission Cancelled',
          description: `You cancelled the mission request at ${b.siteName || 'Unknown Site'}.`,
          reference: b.bookingReference,
          status: 'CANCELLED',
          icon: Ban,
          iconBg: 'bg-slate-100 dark:bg-slate-900/40',
          iconColor: 'text-slate-600 dark:text-slate-400',
        })
      }

      // 4. CLZ Usage Confirmed
      if (b.clzConfirmedAt) {
        list.push({
          id: `${b.id}-clz`,
          bookingId: b.id,
          timestamp: new Date(b.clzConfirmedAt),
          title: b.clzUsed ? 'Emergency Landing Confirmed' : 'Nominal Flight Declared',
          description: b.clzUsed
            ? `Confirmed landing at emergency recovery site ${b.siteName || 'Unknown Site'}.`
            : `Declared nominal flight with no usage of emergency site ${b.siteName || 'Unknown Site'}.`,
          reference: b.bookingReference,
          status: b.clzUsed ? 'COMPLETED' : 'CANCELLED',
          icon: Activity,
          iconBg: b.clzUsed ? 'bg-blue-100 dark:bg-blue-950/40' : 'bg-slate-100 dark:bg-slate-900/40',
          iconColor: b.clzUsed ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400',
        })
      }
    })

    // Sort by timestamp descending
    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [bookings])

  return (
    <Card className="flex flex-col border-border/60 shadow-md pt-2 pb-0">
      <CardHeader className="border-b border-border/40 bg-muted/30 py-4 px-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4.5 w-4.5 text-primary shrink-0" />
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground truncate">
              Action Inbox
            </CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Live updates & activity stream for your operations
            </CardDescription>
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
        ) : activities.length > 0 ? (
          <div className="divide-y divide-border/40 max-h-[350px] overflow-y-auto custom-scrollbar">
            {activities.slice(0, 15).map((activity) => {
              const Icon = activity.icon
              const timeStr = format(activity.timestamp, 'dd MMM yyyy HH:mm')

              return (
                <div
                  key={activity.id}
                  className="group flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/5"
                >
                  <div className="flex gap-3 min-w-0">
                    <div className={cn('p-2 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center', activity.iconBg)}>
                      <Icon className={cn('h-4.5 w-4.5', activity.iconColor)} />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {activity.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-normal font-medium">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/80 font-mono">
                        <span>Ref: {activity.reference}</span>
                        <span>•</span>
                        <span>{timeStr}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0 border-border/60 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    asChild
                  >
                    <Link href={`/dashboard/operator/bookings/${activity.bookingId}`} title="View Details">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[240px]">
            <div className="mb-3 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">
              Inbox is Empty
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              No activity logs have been recorded for your account.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
