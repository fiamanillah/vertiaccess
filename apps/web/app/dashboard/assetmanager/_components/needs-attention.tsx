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
import {
  Inbox,
  Calendar,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { bookingService } from '@/services/booking.service'
import { incidentQueryService } from '@/services/incident-query.service'
import { siteService } from '@/services/site.service'

interface AttentionItem {
  id: string
  type: 'booking_request' | 'emergency_confirmation' | 'incident' | 'site_verification'
  title: string
  description: string
  action: string
  link: string
  createdAt?: Date
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

export function NeedsAttention() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [needsAttention, setNeedsAttention] = React.useState<AttentionItem[]>([])

  React.useEffect(() => {
    let mounted = true

    async function loadAttentionItems() {
      try {
        setIsLoading(true)

        const [pendingBookingsRes, sitesRes, incidentsRes] = await Promise.all([
          bookingService.listAssetManagerBookings({
            bucket: 'pending',
            limit: 5,
          }).catch(() => ({ success: false, data: [] })),
          siteService.listSites().catch(() => ({ success: false, data: [] })),
          incidentQueryService.listMyIncidents().catch(() => []),
        ])

        if (!mounted) return

        const now = new Date()
        const attentionItems: AttentionItem[] = []

        // Needs Attention: pending bookings
        for (const b of pendingBookingsRes?.data || []) {
          const start = new Date(b.startTime)
          attentionItems.push({
            id: b.id,
            type: 'booking_request',
            title: `${b.operatorName} requested ${b.useCategory === 'planned_toal' ? 'Planned TOAL' : 'Emergency and recovery'}`,
            description: `${b.siteName} for ${start.toLocaleDateString()} at ${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
            action: 'Review Request',
            link: '/dashboard/assetmanager/scheduler',
            createdAt: new Date(b.createdAt || b.startTime),
          })
        }

        // Needs Attention: unresolved incidents
        for (const ticket of incidentsRes || []) {
          if (ticket.status !== 'resolved') {
            attentionItems.push({
              id: ticket.id,
              type: 'incident',
              title: `Incident: ${ticket.category || 'Safety Alert'}`,
              description: `${ticket.siteName} - ${ticket.description}`,
              action: 'Review Incident',
              link: `/dashboard/assetmanager/incident-report/${ticket.id}`,
              createdAt: new Date(ticket.createdAt),
            })
          }
        }

        // Needs Attention: site verification updates
        if (sitesRes?.success && sitesRes?.data) {
          for (const s of sitesRes.data) {
            if (s.status === 'UNDER_REVIEW') {
              attentionItems.push({
                id: s.id,
                type: 'site_verification',
                title: `Site Verification Pending: ${s.name}`,
                description: 'Your site submission is currently under review by administrators.',
                action: 'View Details',
                link: `/dashboard/assetmanager/infrastructure/${s.id}`,
                createdAt: new Date(s.createdAt || now),
              })
            } else if (s.status === 'REJECTED') {
              const reason = s.rejectionReasonNote || s.adminNote || 'No reason provided.'
              attentionItems.push({
                id: s.id,
                type: 'site_verification',
                title: `Site Verification Rejected: ${s.name}`,
                description: `Verification rejected. Reason: ${reason}`,
                action: 'Update Site',
                link: `/dashboard/assetmanager/infrastructure/edit/${s.id}`,
                createdAt: new Date(s.createdAt || now),
              })
            }
          }
        }

        // Sort all attention items by date descending (newest first)
        attentionItems.sort((a, b) => {
          const timeA = a.createdAt ? a.createdAt.getTime() : 0
          const timeB = b.createdAt ? b.createdAt.getTime() : 0
          return timeB - timeA
        })

        setNeedsAttention(attentionItems.slice(0, 5))
      } catch (error) {
        console.error('Failed to load dashboard attention items', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadAttentionItems()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <Card className="flex flex-col border-border/60 shadow-md">
      <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
            <Inbox className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold tracking-tight">
              Needs your attention
            </CardTitle>
            <CardDescription className="text-xs font-normal text-muted-foreground">
              Action Inbox
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
        ) : needsAttention.length > 0 ? (
          <div className="divide-y divide-border/40">
            {needsAttention.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/5"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background shadow-sm">
                    {item.type === 'booking_request' && (
                      <Calendar className="h-4 w-4 text-primary" />
                    )}
                    {item.type === 'emergency_confirmation' && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    {item.type === 'incident' && (
                      <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                    )}
                    {item.type === 'site_verification' && (
                      <UserCheck className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-none truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-border/60 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    asChild
                  >
                    <Link href={item.link}>
                      {item.action}
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
              <CheckCircle2 className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              All caught up!
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[15rem]">
              No items require your immediate attention right now.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
