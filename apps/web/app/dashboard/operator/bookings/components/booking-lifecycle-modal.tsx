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
  Cpu,
  Shield,
  User,
  Building,
  Calendar,
  Clock,
  Copy,
  Check,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'
import { bookingService } from '@/services/booking.service'
import type { Booking } from '../types'
import type {
  BookingLifecycleEvent,
  BookingTimelineResponse,
} from '@/services/booking.types'

interface BookingLifecycleModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
}

function getEventColors(eventType: BookingLifecycleEvent['eventType']) {
  switch (eventType) {
    case 'BOOKING_CREATED':
    case 'BOOKING_SUBMITTED':
    case 'BOOKING_APPROVED':
    case 'PAYMENT_CHARGED':
    case 'PAYMENT_CONFIRMED':
    case 'CERTIFICATE_ISSUED':
      return {
        icon: 'text-primary bg-primary/10 border-primary/20',
        stripe: 'bg-primary',
        badge: 'bg-primary/10 text-primary border-primary/20',
      }
    case 'BOOKING_REJECTED':
    case 'BOOKING_CANCELLED':
    case 'PAYMENT_FAILED':
      return {
        icon: 'text-destructive bg-destructive/10 border-destructive/20',
        stripe: 'bg-destructive',
        badge: 'bg-destructive/10 text-destructive border-destructive/20',
      }
    case 'PAYMENT_INITIATED':
      return {
        icon: 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse',
        stripe: 'bg-amber-500 dark:bg-amber-400',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      }
    case 'REFUND_COMPLETED':
      return {
        icon: 'text-secondary-foreground bg-secondary/80 border-secondary/20',
        stripe: 'bg-secondary-foreground/40',
        badge: 'bg-secondary text-secondary-foreground border-secondary/20',
      }
    case 'EMERGENCY_USAGE_CONFIRMED':
    case 'EMERGENCY_NOT_USED':
      return {
        icon: 'text-accent-foreground bg-accent border-accent/20',
        stripe: 'bg-accent-foreground/40',
        badge: 'bg-accent text-accent-foreground border-accent/20',
      }
    default:
      return {
        icon: 'text-muted-foreground bg-muted border-border',
        stripe: 'bg-muted-foreground/30',
        badge: 'bg-muted text-muted-foreground border-border',
      }
  }
}

function getEventIcon(eventType: BookingLifecycleEvent['eventType']) {
  switch (eventType) {
    case 'BOOKING_CREATED':
      return <CircleDot className="h-4 w-4" />
    case 'BOOKING_SUBMITTED':
      return <History className="h-4 w-4" />
    case 'BOOKING_APPROVED':
      return <CheckCircle2 className="h-4 w-4" />
    case 'BOOKING_REJECTED':
    case 'BOOKING_CANCELLED':
      return <XCircle className="h-4 w-4" />
    case 'PAYMENT_INITIATED':
      return <Loader2 className="h-4 w-4 animate-spin" />
    case 'PAYMENT_CHARGED':
    case 'PAYMENT_CONFIRMED':
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

function getActorDetails(actorType: BookingLifecycleEvent['actorType']) {
  switch (actorType) {
    case 'system':
      return {
        label: 'System',
        icon: <Cpu className="h-3 w-3" />,
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      }
    case 'admin':
      return {
        label: 'Admin',
        icon: <Shield className="h-3 w-3" />,
        className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      }
    case 'landowner':
      return {
        label: 'Asset Owner',
        icon: <Building className="h-3 w-3" />,
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      }
    case 'operator':
    default:
      return {
        label: 'Operator',
        icon: <User className="h-3 w-3" />,
        className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      }
  }
}

function getStatusBadgeConfig(status: string) {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return {
        label: 'Approved',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-500 animate-pulse',
      }
    case 'PENDING':
      return {
        label: 'Pending',
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        dot: 'bg-amber-500 animate-pulse',
      }
    case 'REJECTED':
      return {
        label: 'Rejected',
        className: 'bg-destructive/10 text-destructive border-destructive/20',
        dot: 'bg-destructive',
      }
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        className: 'bg-muted text-muted-foreground border-border',
        dot: 'bg-muted-foreground',
      }
    case 'EXPIRED':
      return {
        label: 'Expired',
        className: 'bg-muted text-muted-foreground border-border',
        dot: 'bg-muted-foreground',
      }
    default:
      return {
        label: status,
        className: 'bg-primary/10 text-primary border-primary/20',
        dot: 'bg-primary',
      }
  }
}

function renderEventMetadata(metadata: Record<string, any> | undefined | null) {
  if (!metadata) return null

  const keysToIgnore = ['bookingId', 'bookingReference']
  const entries = Object.entries(metadata).filter(([key]) => !keysToIgnore.includes(key))

  if (entries.length === 0) return null

  // Special cases
  const reason = metadata.reason || metadata.cancellationReason || metadata.rejectionReason
  const error = metadata.error || metadata.errorMessage || metadata.message
  const amount = metadata.amount || metadata.price
  const currency = metadata.currency || 'USD'

  return (
    <div className="mt-3 space-y-2">
      {/* Show reason callout */}
      {reason && (
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Reason:</span>{' '}
          {String(reason)}
        </div>
      )}

      {/* Show error callout */}
      {error && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-3 text-xs text-destructive">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Error:</span>{' '}
          {String(error)}
        </div>
      )}

      {/* General key-value badges */}
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([key, val]) => {
          if (['reason', 'cancellationReason', 'rejectionReason', 'error', 'errorMessage', 'message'].includes(key)) {
            return null // Already handled
          }
          let displayValue = String(val)
          if (key === 'amount' && typeof val === 'number') {
            displayValue = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val)
          }
          // Humanize key
          const humanKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())

          return (
            <div
              key={key}
              className="inline-flex items-center gap-1 rounded bg-muted/40 border border-border/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
            >
              <span className="font-semibold text-foreground/70">{humanKey}:</span>
              <span>{displayValue}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
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
  const [copied, setCopied] = React.useState(false)

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
      } catch (err) {
        if (isActive) {
          setError(
            err instanceof Error
              ? err.message
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

  const copyToReference = () => {
    if (!booking) return
    navigator.clipboard.writeText(booking.bookingReference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!booking) return null

  const events = timeline?.events ?? []
  const statusConfig = getStatusBadgeConfig(booking.status)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-w-2xl w-[95vw] md:w-full p-0 gap-0 overflow-hidden bg-background border border-border/80 shadow-2xl rounded-xl">
        <DialogHeader className="p-6 border-b bg-muted/20 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <History className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
                  Booking Lifecycle
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Full lifecycle timeline from creation to payment outcome for booking reference {booking.bookingReference}
                </DialogDescription>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Reference:</span>
                  <span className="font-mono font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40 flex items-center gap-1">
                    {booking.bookingReference}
                    <button
                      onClick={copyToReference}
                      className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                      title="Copy Reference"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </span>
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 border flex items-center gap-1.5',
                statusConfig.className
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] overflow-y-auto">
          <div className="p-6">
            {/* Booking Mini Summary Card */}
            <div className="mb-6 rounded-xl border border-border/50 bg-muted/10 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <Building className="h-3 w-3" /> Site
                  </div>
                  <div className="font-semibold text-foreground truncate mt-1">
                    {booking.siteName || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Start Date
                  </div>
                  <div className="font-semibold text-foreground truncate mt-1">
                    {format(new Date(booking.startTime), 'dd MMM yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Duration
                  </div>
                  <div className="font-semibold text-foreground truncate mt-1">
                    {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Cost
                  </div>
                  <div className="font-semibold text-foreground truncate mt-1">
                    {booking.toalCost !== null && booking.toalCost !== undefined ? (
                      `$${(booking.toalCost / 100).toFixed(2)}`
                    ) : (
                      'Free / Subscription'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex min-h-80 flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-medium animate-pulse">Loading timeline history...</span>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <div className="font-semibold">Error Loading Timeline</div>
                  <div>{error}</div>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <History className="h-8 w-8 text-muted-foreground/40" />
                <span>No lifecycle events have been recorded for this booking yet.</span>
              </div>
            ) : (
              <div className="relative pl-12 space-y-6 before:absolute before:left-[20px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60">
                {events.map((event) => {
                  const eventColors = getEventColors(event.eventType)
                  const actorDetails = getActorDetails(event.actorType)

                  return (
                    <div
                      key={event.id}
                      className="relative group transition-all duration-300"
                    >
                      {/* Timeline Dot Icon */}
                      <div
                        className={cn(
                          'absolute left-[-34px] top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm transition-all duration-300 group-hover:scale-110',
                          eventColors.icon,
                        )}
                      >
                        {getEventIcon(event.eventType)}
                      </div>

                      {/* Event Detail Card */}
                      <div className="relative rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 pl-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 overflow-hidden">
                        {/* Event Left Indicator Stripe */}
                        <div
                          className={cn(
                            'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
                            eventColors.stripe,
                          )}
                        />

                        {/* Title and Time */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-medium">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                            <span>{format(new Date(event.createdAt), 'dd MMM yyyy')}</span>
                            <span className="text-muted-foreground/30">•</span>
                            <span>{format(new Date(event.createdAt), 'HH:mm')}</span>
                          </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                          <p className="mt-2 text-xs md:text-sm leading-relaxed text-muted-foreground/90">
                            {event.description}
                          </p>
                        )}

                        {/* Metadata Callouts/Badges */}
                        {renderEventMetadata(event.metadata)}

                        {/* Card Footer Badges */}
                        <Separator className="my-3 opacity-50" />

                        <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-medium uppercase tracking-wider">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'px-2 py-0.5 flex items-center gap-1 shadow-none border',
                                actorDetails.className,
                              )}
                            >
                              {actorDetails.icon}
                              {actorDetails.label}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="px-2 py-0.5 text-muted-foreground bg-muted/60 border-none shadow-none"
                            >
                              {event.eventType.replaceAll('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
