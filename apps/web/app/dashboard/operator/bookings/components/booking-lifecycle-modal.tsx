'use client'

import * as React from 'react'
import { format } from 'date-fns'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleDot,
  CreditCard,
  FileCheck2,
  History,
  Loader2,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'
import { bookingService } from '@/services/booking.service'
import type {
  Booking,
  BookingLifecycleEvent,
  BookingTimelineResponse,
} from '../types'

interface BookingLifecycleModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
}

function getEventTone(eventType: BookingLifecycleEvent['eventType']) {
  switch (eventType) {
    case 'BOOKING_CREATED':
    case 'BOOKING_APPROVED':
    case 'PAYMENT_CHARGED':
    case 'CERTIFICATE_ISSUED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'BOOKING_REJECTED':
    case 'BOOKING_CANCELLED':
    case 'PAYMENT_FAILED':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'REFUND_COMPLETED':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'EMERGENCY_USAGE_CONFIRMED':
    case 'EMERGENCY_NOT_USED':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700'
    default:
      return 'border-border bg-muted/30 text-foreground'
  }
}

function getEventIcon(eventType: BookingLifecycleEvent['eventType']) {
  switch (eventType) {
    case 'BOOKING_CREATED':
      return <CircleDot className="h-4 w-4" />
    case 'BOOKING_APPROVED':
      return <CheckCircle2 className="h-4 w-4" />
    case 'BOOKING_REJECTED':
    case 'BOOKING_CANCELLED':
      return <XCircle className="h-4 w-4" />
    case 'PAYMENT_CHARGED':
      return <CreditCard className="h-4 w-4" />
    case 'PAYMENT_FAILED':
      return <AlertTriangle className="h-4 w-4" />
    case 'REFUND_COMPLETED':
      return <RotateCcw className="h-4 w-4" />
    case 'EMERGENCY_USAGE_CONFIRMED':
      return <ShieldCheck className="h-4 w-4" />
    case 'EMERGENCY_NOT_USED':
      return <Ban className="h-4 w-4" />
    case 'CERTIFICATE_ISSUED':
      return <FileCheck2 className="h-4 w-4" />
    default:
      return <History className="h-4 w-4" />
  }
}

function formatActorLabel(event: BookingLifecycleEvent) {
  if (event.actorType === 'system') return 'System'
  if (event.actorType === 'admin') return 'Admin'
  if (event.actorType === 'landowner') return 'Landowner'
  return 'Operator'
}

export function BookingLifecycleModal({
  booking,
  isOpen,
  onClose,
}: BookingLifecycleModalProps) {
  const [timeline, setTimeline] =
    React.useState<BookingTimelineResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isActive = true

    async function loadTimeline() {
      if (!isOpen || !booking) return

      setIsLoading(true)
      setError(null)

      try {
        const data = await bookingService.getBookingTimeline(booking.id)
        if (isActive) {
          setTimeline(data)
        }
      } catch (error) {
        if (isActive) {
          setError(
            error instanceof Error
              ? error.message
              : 'Failed to load booking timeline',
          )
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadTimeline()

    return () => {
      isActive = false
    }
  }, [booking, isOpen])

  React.useEffect(() => {
    if (!isOpen) {
      setTimeline(null)
      setError(null)
      setIsLoading(false)
    }
  }, [isOpen])

  if (!booking) return null

  const events = timeline?.events ?? []

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 border-b bg-linear-to-br from-background via-background to-muted/20">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight uppercase flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Booking Lifecycle
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Booking {booking.bookingReference} · Full lifecycle from
                creation to payment outcome
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5"
            >
              {booking.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(85vh-88px)] overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading timeline...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              No lifecycle events have been recorded yet.
            </div>
          ) : (
            <div className="space-y-0">
              {events.map((event, index) => {
                const hasConnector = index < events.length - 1

                return (
                  <div
                    key={event.id}
                    className="relative flex gap-4 pb-8 last:pb-0"
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full border shadow-sm',
                          getEventTone(event.eventType),
                        )}
                      >
                        {getEventIcon(event.eventType)}
                      </div>
                      {hasConnector && (
                        <div className="mt-2 h-full w-px bg-border/70" />
                      )}
                    </div>

                    <div className="flex-1 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <h3 className="text-sm font-black uppercase tracking-wider">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <div>
                            {format(new Date(event.createdAt), 'dd MMM yyyy')}
                          </div>
                          <div>
                            {format(new Date(event.createdAt), 'HH:mm')}
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <Badge variant="outline" className="px-2 py-0.5">
                          {formatActorLabel(event)}
                        </Badge>
                        <Badge variant="secondary" className="px-2 py-0.5">
                          {event.eventType.replaceAll('_', ' ')}
                        </Badge>
                        {event.metadata &&
                          'bookingReference' in event.metadata && (
                            <span className="text-muted-foreground">
                              Ref {String(event.metadata.bookingReference)}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
