'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card'
import { ClipboardList, Clock, FileText, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { Booking } from '@/services/booking.types'

interface ActionInboxCardProps {
  isLoading: boolean
  bookings: Booking[]
}

interface ActivityEvent {
  id: string
  timestamp: Date
  title: string
  description: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export function ActivityLogCard({ isLoading, bookings }: ActionInboxCardProps) {
  const activities = React.useMemo(() => {
    if (!bookings) return []
    const events: ActivityEvent[] = []

    bookings.forEach((booking) => {
      const siteName = booking.siteName || 'Unknown Site'
      const ref = booking.bookingReference || 'N/A'

      // Event 1: Submitted
      if (booking.createdAt) {
        events.push({
          id: `${booking.id}-submitted`,
          timestamp: new Date(booking.createdAt),
          title: 'Mission Request Submitted',
          description: `Flight request for ${siteName} (Ref: ${ref}) was submitted successfully.`,
          type: 'info',
        })
      }

      // Event 2: Approved / Rejected / Cancelled
      if (booking.status === 'APPROVED') {
        events.push({
          id: `${booking.id}-approved`,
          timestamp: new Date(booking.startTime), // Use startTime as a proxy or estimation
          title: 'Mission Request Approved',
          description: `Your flight request for ${siteName} (Ref: ${ref}) was approved by the Asset Manager.`,
          type: 'success',
        })
      } else if (booking.status === 'REJECTED') {
        events.push({
          id: `${booking.id}-rejected`,
          timestamp: new Date(booking.createdAt),
          title: 'Mission Request Rejected',
          description: `Your flight request for ${siteName} (Ref: ${ref}) was rejected.`,
          type: 'error',
        })
      } else if (booking.status === 'CANCELLED') {
        events.push({
          id: `${booking.id}-cancelled`,
          timestamp: new Date(booking.createdAt),
          title: 'Mission Request Cancelled',
          description: `Your flight request for ${siteName} (Ref: ${ref}) was cancelled.`,
          type: 'warning',
        })
      }

      // Event 3: Completed
      if (booking.status === 'COMPLETED') {
        events.push({
          id: `${booking.id}-completed`,
          timestamp: new Date(booking.endTime),
          title: 'Mission Completed',
          description: `Flight operation at ${siteName} (Ref: ${ref}) completed successfully.`,
          type: 'success',
        })
      }
    })

    // Sort by timestamp descending
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8)
  }, [bookings])

  return (
    <Card className="flex flex-col border-border/60 shadow-md">
      <CardHeader className="border-b border-border/40 bg-muted/30 py-4 px-5">
        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {isLoading ? (
          <div className="divide-y divide-border/40">
            <div className="p-4 flex gap-3">
              <div className="h-4 w-4 rounded bg-muted/50 animate-pulse mt-0.5 shrink-0" />
              <div className="space-y-2 w-full">
                <div className="h-3.5 bg-muted/50 animate-pulse rounded max-w-[150px]" />
                <div className="h-3 bg-muted/50 animate-pulse rounded" />
              </div>
            </div>
            <div className="p-4 flex gap-3">
              <div className="h-4 w-4 rounded bg-muted/50 animate-pulse mt-0.5 shrink-0" />
              <div className="space-y-2 w-full">
                <div className="h-3.5 bg-muted/50 animate-pulse rounded max-w-[150px]" />
                <div className="h-3 bg-muted/50 animate-pulse rounded" />
              </div>
            </div>
          </div>
        ) : activities.length > 0 ? (
          <div className="divide-y divide-border/40 max-h-[350px] overflow-y-auto custom-scrollbar">
            {activities.map((act) => (
              <div key={act.id} className="p-4 flex gap-3 hover:bg-muted/5 transition-colors">
                <div className="mt-0.5 shrink-0">
                  {act.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {act.type === 'info' && <FileText className="h-4 w-4 text-blue-500" />}
                  {act.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {act.type === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">{act.title}</p>
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                      {format(act.timestamp, 'dd MMM HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-normal">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[240px]">
            <Clock className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-semibold text-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              Activity updates will appear here once flight operations are initiated.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
