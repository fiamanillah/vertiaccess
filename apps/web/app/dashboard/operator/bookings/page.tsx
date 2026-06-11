// apps/web/app/dashboard/operator/bookings/page.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Checkbox } from '@workspace/ui/components/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import {
  AlertCircle,
  Calendar,
  MapPin,
  Trash2,
  Search,
  Zap,
  Shield,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { CancellationModal } from './components/cancellation-modal'
import { EmergencyBanner } from './components/emergency-banner'
import type { Booking } from './types'
import { bookingService } from '@/services/booking.service'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { cn } from '@workspace/ui/lib/utils'

const MissionPlanningMap = dynamic(
  () =>
    import('./components/mission-planning-map').then(
      (m) => m.MissionPlanningMap,
    ),
  { ssr: false },
)

function toTitleCase(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function OperatorBookingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingIdParam = searchParams ? searchParams.get('bookingId') : null

  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<
    'all' | Booking['status']
  >('all')
  const [categoryFilter, setCategoryFilter] = React.useState<
    'all' | Booking['useCategory']
  >('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  const [selectedBookingIds, setSelectedBookingIds] = React.useState<
    Set<string>
  >(new Set())
  const [focusedBookingId, setFocusedBookingId] = React.useState<string | null>(
    null,
  )

  // Pagination states
  const [pageIndex, setPageIndex] = React.useState(0)
  const pageSize = 5

  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false)
  const [bookingToCancel, setBookingToCancel] = React.useState<Booking | null>(
    null,
  )

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Failed to load bookings'

  const fetchBookings = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await bookingService.listMyBookings({
        status: statusFilter,
        useCategory: categoryFilter,
      })
      setBookings(data)
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, categoryFilter])

  // Fetch bookings from the backend whenever filters change
  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBookings()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchBookings])

  // Reset page index when search or filter values change
  React.useEffect(() => {
    setPageIndex(0)
  }, [searchQuery, statusFilter, categoryFilter])

  // Handle URL booking selection query param
  React.useEffect(() => {
    if (bookingIdParam && bookings.length > 0) {
      setSelectedBookingIds(new Set([bookingIdParam]))
      setFocusedBookingId(bookingIdParam)
    }
  }, [bookingIdParam, bookings])

  // Emergency booking that has ended and not yet resolved
  const unresolvedEmergency = bookings.find(
    (b) =>
      b.useCategory === 'emergency_recovery' &&
      b.status === 'APPROVED' &&
      new Date(b.endTime) < new Date() &&
      (b.paymentStatus === 'authorized' || b.paymentStatus === 'pending') &&
      !b.clzConfirmedAt,
  )

  const handleCancelRequest = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation()
    setBookingToCancel(booking)
    setIsCancelModalOpen(true)
  }

  const confirmCancellation = async (booking: Booking) => {
    try {
      await bookingService.cancelBooking(booking.id)
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                status: 'CANCELLED',
                cancelledAt: new Date().toISOString(),
              }
            : b,
        ),
      )
      setIsCancelModalOpen(false)
      toast.success(
        `Booking ${booking.bookingReference} cancelled successfully`,
      )
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleEmergencyResolve = async (booking: Booking, used: boolean) => {
    try {
      const updated = await bookingService.confirmEmergencyUsage(
        booking.id,
        used,
      )
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? (updated as unknown as Booking) : b,
        ),
      )
      toast.success(
        used
          ? 'Emergency usage confirmed. Payment is processing.'
          : 'No usage confirmed. No charge applied.',
      )
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleToggleBookingCheckbox = (
    bookingId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    setSelectedBookingIds((prev) => {
      const next = new Set(prev)
      if (next.has(bookingId)) {
        next.delete(bookingId)
      } else {
        next.add(bookingId)
      }
      return next
    })
  }

  const handleCardClick = (bookingId: string) => {
    setFocusedBookingId(bookingId === focusedBookingId ? null : bookingId)
    // Automatically select the checkbox if focused to draw geometry on map
    setSelectedBookingIds((prev) => {
      const next = new Set(prev)
      next.add(bookingId)
      return next
    })
  }

  // Filter bookings locally by search query (siteName or bookingReference)
  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        !searchQuery ||
        (b.siteName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.bookingReference || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [bookings, searchQuery])

  // Pagination calculations
  const totalRows = filteredBookings.length
  const totalPages = Math.max(Math.ceil(totalRows / pageSize), 1)
  const effectivePageIndex = Math.min(pageIndex, Math.max(totalPages - 1, 0))

  const pagedBookings = React.useMemo(() => {
    return filteredBookings.slice(
      effectivePageIndex * pageSize,
      (effectivePageIndex + 1) * pageSize,
    )
  }, [filteredBookings, effectivePageIndex, pageSize])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8  mx-auto h-[calc(100vh-80px)] min-h-[600px]">
      {/* Header with Filters on the right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Mission Planning
          </h1>
        </div>

        {/* Filters aligned right */}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as typeof statusFilter)
            }
          >
            <SelectTrigger className="w-[140px] text-xs h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(value) =>
              setCategoryFilter(value as typeof categoryFilter)
            }
          >
            <SelectTrigger className="w-[150px] text-xs h-9">
              <SelectValue placeholder="Booking type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="planned_toal">Planned TOAL</SelectItem>
              <SelectItem value="emergency_recovery">
                Emergency and recovery
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9 px-3"
            onClick={() => {
              setStatusFilter('all')
              setCategoryFilter('all')
              setSearchQuery('')
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-destructive hover:text-destructive"
            onClick={() => {
              void fetchBookings()
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Emergency Incident Alert */}
      {!isLoading && unresolvedEmergency && (
        <div className="shrink-0">
          <EmergencyBanner
            booking={unresolvedEmergency}
            onResolve={handleEmergencyResolve}
          />
        </div>
      )}

      {/* Main Map & List Layout Grid */}
      <Card className="flex flex-col border-border/60 shadow-md overflow-hidden flex-1 min-h-0">
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Left Panel: Map */}
          <div className="flex-1 min-h-[300px] lg:min-h-0 relative bg-muted/20 border-b lg:border-b-0 lg:border-r border-border/40">
            <MissionPlanningMap
              bookings={filteredBookings}
              selectedBookingIds={selectedBookingIds}
              focusedBookingId={focusedBookingId}
              onSelectBooking={(id) => handleCardClick(id)}
              className="w-full h-full"
            />
          </div>

          {/* Right Panel: Operations List */}
          <div className="w-full lg:w-[40%] flex flex-col h-full bg-background min-h-0 shrink-0 lg:shrink">
            {/* Search filter inside sidebar list */}
            <div className="px-4 py-2.5 border-b border-border/40 bg-muted/5 flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search asset or ref..."
                  className="w-full text-xs bg-background border border-border/60 rounded-md pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {/* Scrollable list items */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40 custom-scrollbar">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  <div className="h-20 w-full rounded-lg bg-muted/30 animate-pulse" />
                  <div className="h-20 w-full rounded-lg bg-muted/30 animate-pulse" />
                  <div className="h-20 w-full rounded-lg bg-muted/30 animate-pulse" />
                </div>
              ) : pagedBookings.length > 0 ? (
                pagedBookings.map((booking) => {
                  const isChecked = selectedBookingIds.has(booking.id)
                  const isFocused = booking.id === focusedBookingId
                  const startTime = new Date(booking.startTime)
                  const endTime = new Date(booking.endTime)
                  const dateStr = format(startTime, 'dd MMM yyyy')
                  const timeStr = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`
                  const fullWindowStr = `${dateStr} • ${timeStr}`

                  // Determine status styling
                  let statusColor =
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                  if (booking.status === 'APPROVED') {
                    statusColor =
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                  } else if (booking.status === 'ACTIVATED') {
                    statusColor =
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  } else if (booking.status === 'COMPLETED') {
                    statusColor =
                      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                  } else if (
                    booking.status === 'REJECTED' ||
                    booking.status === 'CANCELLED' ||
                    booking.status === 'EXPIRED'
                  ) {
                    statusColor =
                      'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  }

                  const isPast = endTime < new Date()
                  const canCancel =
                    (booking.status === 'PENDING' ||
                      booking.status === 'APPROVED') &&
                    !isPast

                  return (
                    <div
                      key={booking.id}
                      className={cn(
                        'p-4 transition-all duration-200 cursor-pointer flex flex-col gap-2 hover:bg-muted/5 border-l-4 border-transparent',
                        isFocused &&
                          'bg-primary/[0.02] dark:bg-primary/[0.01] border-l-primary border-y border-border/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] my-0.5',
                      )}
                      onClick={() => handleCardClick(booking.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {/* Checkbox to render boundary shapes on map */}
                          <div
                            onClick={(e) =>
                              handleToggleBookingCheckbox(booking.id, e)
                            }
                            className="flex items-center justify-center p-1 hover:bg-muted rounded-md cursor-pointer shrink-0 mt-0.5"
                            title={
                              isChecked
                                ? 'Hide takeoff/landing on map'
                                : 'Show takeoff/landing on map'
                            }
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => {}}
                              className="pointer-events-none"
                            />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <span className="text-sm font-semibold text-foreground truncate block">
                              {booking.siteName || 'Unknown Site'}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                              <span>Ref: {booking.bookingReference}</span>
                              <span>•</span>
                              <span>{dateStr}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            className={cn(
                              'text-[9px] uppercase tracking-wider font-bold border-none px-1.5 py-0.5',
                              statusColor,
                            )}
                          >
                            {booking.status}
                          </Badge>
                          {isFocused ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                          )}
                        </div>
                      </div>

                      {/* Expandable Details Container */}
                      {isFocused && (
                        <div className="mt-2 pt-3 border-t border-border/40 text-xs text-foreground space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded-lg border border-border/30">
                            <div className="col-span-2">
                              <span className="text-[10px] text-muted-foreground block font-medium">
                                Asset
                              </span>
                              <span className="font-semibold text-sm flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                {booking.siteName}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground block font-medium">
                                Asset Capability
                              </span>
                              <Badge
                                className={cn(
                                  'text-[9px] font-bold mt-0.5 border-none',
                                  booking.useCategory === 'planned_toal'
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-amber-500 text-white',
                                )}
                              >
                                {booking.useCategory === 'planned_toal'
                                  ? 'Planned TOAL'
                                  : 'Emergency Recovery'}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground block font-medium">
                                Mission
                              </span>
                              <span className="font-medium capitalize">
                                {toTitleCase(booking.missionIntent || 'N/A')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground block font-medium">
                                Operation Type
                              </span>
                              <Badge
                                className={cn(
                                  'text-[9px] font-bold mt-0.5 border-none',
                                  booking.operationType === 'INBOUND'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-purple-500 text-white',
                                )}
                              >
                                {booking.operationType || 'N/A'}
                              </Badge>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[10px] text-muted-foreground block font-medium">
                                Operation Window
                              </span>
                              <span className="font-semibold flex items-center gap-1.5 text-xs">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {fullWindowStr}
                              </span>
                            </div>
                            {booking.droneModel && (
                              <div className="col-span-2 border-t border-border/20 pt-2">
                                <span className="text-[10px] text-muted-foreground block font-medium">
                                  Aircraft
                                </span>
                                <span className="font-medium text-xs">
                                  {booking.droneModel} ({booking.manufacturer})
                                </span>
                              </div>
                            )}
                            <div className="border-t border-border/20 pt-2">
                              <span className="text-[10px] text-muted-foreground block font-medium">
                                Access Fee
                              </span>
                              <span className="font-semibold">
                                £{(booking.toalCost ?? 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="border-t border-border/20 pt-2">
                              <span className="text-[10px] text-muted-foreground block font-medium">
                                Payment Status
                              </span>
                              <span className="font-semibold capitalize text-xs">
                                {booking.paymentStatus || 'Pending'}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs font-semibold gap-1.5 h-8 border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link
                                href={`/dashboard/operator/bookings/${booking.id}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Details Page
                              </Link>
                            </Button>
                            {canCancel && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full text-xs font-semibold gap-1.5 h-8 bg-red-600 hover:bg-red-700 text-white border-none"
                                onClick={(e) => handleCancelRequest(booking, e)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Cancel Mission
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    No operations found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                    Try adjusting your search query or filters.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalRows > 0 && (
              <div className="px-4 py-3 border-t border-border/40 bg-muted/5 flex items-center justify-between gap-4 shrink-0 text-xs text-muted-foreground select-none">
                <span>
                  Showing{' '}
                  <span className="font-semibold text-foreground">
                    {totalRows === 0 ? 0 : effectivePageIndex * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-foreground">
                    {Math.min((effectivePageIndex + 1) * pageSize, totalRows)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-foreground">
                    {totalRows}
                  </span>{' '}
                  missions
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground border-border/60 hover:text-foreground"
                    onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
                    disabled={effectivePageIndex === 0 || totalPages <= 1}
                    title="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground border-border/60 hover:text-foreground"
                    onClick={() =>
                      setPageIndex((p) => Math.min(p + 1, totalPages - 1))
                    }
                    disabled={
                      effectivePageIndex === totalPages - 1 || totalPages <= 1
                    }
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <CancellationModal
        booking={bookingToCancel}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancellation}
      />
    </div>
  )
}

export default function OperatorBookingsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OperatorBookingsContent />
    </React.Suspense>
  )
}
