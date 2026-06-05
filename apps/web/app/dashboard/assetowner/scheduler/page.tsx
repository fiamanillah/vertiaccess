'use client'

import * as React from 'react'
import { Button } from '@workspace/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  AlertCircle,
  XCircle,
  Inbox,
  AlertTriangle,
} from 'lucide-react'
import { BookingList } from './components/booking-list'
import { BookingLifecycleModal } from '@/app/dashboard/operator/bookings/components/booking-lifecycle-modal'
import { Booking } from './types'
import { toast } from 'sonner'
import { bookingService } from '@/services/booking.service'
import type { PaginatedBookingsResponse } from '@/services/booking.types'
import { useRouter } from 'next/navigation'
import { cn } from '@workspace/ui/lib/utils'
import { format } from 'date-fns'

export default function AssetOwnerOperationsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [selectedTimelineBooking, setSelectedTimelineBooking] =
    React.useState<Booking | null>(null)
  const [isTimelineOpen, setIsTimelineOpen] = React.useState(false)

  // Interactive status filter state
  const [activeBucket, setActiveBucket] = React.useState<
    'all' | 'pending' | 'upcoming' | 'completed' | 'denied'
  >('all')

  const [selectedUseCategory, setSelectedUseCategory] =
    React.useState<string>('all')
  const [selectedDate, setSelectedDate] = React.useState<string>('all')

  const [bookingResponse, setBookingResponse] =
    React.useState<PaginatedBookingsResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Timeline-specific bookings state to show visual occupancy track
  const [timelineBookings, setTimelineBookings] = React.useState<Booking[]>([])

  const currentBookings = React.useMemo(() => {
    const raw = bookingResponse?.data ?? []
    if (selectedDate === 'all') return raw
    return raw.filter((b) => {
      const start = new Date(b.startTime)
      const parts = selectedDate.split('-')
      const y = Number(parts[0])
      const m = Number(parts[1])
      const d = Number(parts[2])
      return (
        start.getFullYear() === y &&
        start.getMonth() === m - 1 &&
        start.getDate() === d
      )
    })
  }, [bookingResponse, selectedDate])
  const paginationMeta = bookingResponse?.meta.pagination
  const counts = bookingResponse?.meta.counts ?? {
    pending: 0,
    upcoming: 0,
    past: 0,
    completed: 0,
    denied: 0,
  }

  // Resolve active date for the visual timeline (always falls back to today if 'all' is selected)
  const timelineDate = React.useMemo(() => {
    return selectedDate === 'all'
      ? format(new Date(), 'yyyy-MM-dd')
      : selectedDate
  }, [selectedDate])

  const getErrorMessage = (value: unknown) =>
    value instanceof Error ? value.message : 'Failed to load operations'

  const loadBookings = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await bookingService.listAssetOwnerBookings({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        bucket: activeBucket === 'all' ? undefined : activeBucket,
        useCategory:
          selectedUseCategory === 'all' ? undefined : selectedUseCategory,
        date: selectedDate === 'all' ? undefined : selectedDate,
      })

      setBookingResponse(response)
    } catch (value) {
      setError(getErrorMessage(value))
      setBookingResponse(null)
    } finally {
      setIsLoading(false)
    }
  }, [
    activeBucket,
    pagination.pageIndex,
    pagination.pageSize,
    selectedUseCategory,
    selectedDate,
  ])

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadBookings()
    })
  }, [loadBookings])

  // Fetch complete timeline data for the active visual scheduler day
  React.useEffect(() => {
    let active = true
    async function fetchTimelineData() {
      try {
        const response = await bookingService.listAssetOwnerBookings({
          limit: 100, // Load all items for the timeline visualization
          date: timelineDate,
        })
        if (active) {
          setTimelineBookings(response.data)
        }
      } catch (err) {
        console.error('Failed to load timeline data', err)
      }
    }
    void fetchTimelineData()
    return () => {
      active = false
    }
  }, [timelineDate])

  // Construct segmented hourly slots for 05:00 to 00:00 (next day)
  const hourlySlots = React.useMemo(() => {
    const hours = Array.from({ length: 20 }, (_, i) => 5 + i) // 05:00 to 24:00 (which is 00:00)

    return hours.map((hour) => {
      const parts = timelineDate.split('-')
      const year = Number(parts[0]) || new Date().getFullYear()
      const month = Number(parts[1]) || new Date().getMonth() + 1
      const day = Number(parts[2]) || new Date().getDate()
      const slotStart = new Date(year, month - 1, day, hour, 0, 0, 0)
      const slotEnd = new Date(year, month - 1, day, hour + 1, 0, 0, 0)

      const overlapping = timelineBookings.find((b) => {
        if (b.status !== 'PENDING' && b.status !== 'APPROVED') return false
        const bStart = new Date(b.startTime)
        const bEnd = new Date(b.endTime)
        return bStart < slotEnd && bEnd > slotStart
      })

      let status: 'available' | 'booked' | 'pending' | 'completed' | 'emergency' = 'available'
      if (overlapping) {
        if (overlapping.useCategory === 'emergency_recovery') {
          status = 'emergency'
        } else if (overlapping.status === 'PENDING') {
          status = 'pending'
        } else if (overlapping.status === 'APPROVED') {
          const now = new Date()
          if (new Date(overlapping.endTime) < now) {
            status = 'completed'
          } else {
            status = 'booked'
          }
        }
      }

      return {
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        status,
        booking: overlapping,
      }
    })
  }, [timelineBookings, timelineDate])

  const handleUseCategoryChange = (value: string) => {
    setSelectedUseCategory(value)
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const handleClearFilters = () => {
    setSelectedUseCategory('all')
    setSelectedDate('all')
    setActiveBucket('all')
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const hasActiveFilters =
    selectedUseCategory !== 'all' ||
    selectedDate !== 'all' ||
    activeBucket !== 'all'

  const handleReview = (booking: Booking) => {
    router.push(`/dashboard/assetowner/scheduler/${booking.id}/review`)
  }

  const handleViewTimeline = (booking: Booking) => {
    setSelectedTimelineBooking(booking)
    setIsTimelineOpen(true)
  }

  const statusOptions = React.useMemo(
    () => [
      { value: 'all', label: 'All Statuses' },
      { value: 'pending', label: `Pending Requests (${counts.pending ?? 0})` },
      { value: 'upcoming', label: `Scheduled (${counts.upcoming ?? 0})` },
      { value: 'completed', label: `Completed (${counts.completed ?? 0})` },
      { value: 'denied', label: `Denied (${counts.denied ?? 0})` },
    ],
    [counts],
  )

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Access Control Center
          </h1>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => void loadBookings()}>
            Retry
          </Button>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Access Requests Card */}
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.03] rounded-full blur-2xl pointer-events-none" />
          <span className="text-xs font-semibold text-muted-foreground">
            Access requests
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {counts.pending}
            </span>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/20 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
              Pending
            </span>
          </div>
        </div>

        {/* Scheduled Operations Card */}
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.03] rounded-full blur-2xl pointer-events-none" />
          <span className="text-xs font-semibold text-muted-foreground">
            Scheduled operations
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {counts.upcoming}
            </span>
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
              Upcoming
            </span>
          </div>
        </div>

        {/* Completed Operations Card */}
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.03] rounded-full blur-2xl pointer-events-none" />
          <span className="text-xs font-semibold text-muted-foreground">
            Completed operations
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {counts.completed ?? 0}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
              Completed
            </span>
          </div>
        </div>

        {/* Denied Operations Card */}
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/[0.03] rounded-full blur-2xl pointer-events-none" />
          <span className="text-xs font-semibold text-muted-foreground">
            Denied operations
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {counts.denied ?? 0}
            </span>
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/20 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
              Denied
            </span>
          </div>
        </div>
      </div>

      {/* ── Visual Occupancy Timeline ── */}
      <div className="relative flex flex-col gap-3 py-1">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* ─ Timeline Visualization ─ */}
        <div className="flex flex-col gap-3 mt-1">
          {/* Legend Row */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Slot Allocations (
              {selectedDate === 'all'
                ? format(new Date(), 'dd MMM yyyy')
                : format(
                    new Date(selectedDate.replace(/-/g, '/')),
                    'dd MMM yyyy',
                  )}
              )
            </span>
            <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500/35 border border-emerald-500/30" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span>Allocated</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Emergency</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Completed</span>
              </div>
            </div>
          </div>

          {/* Segmented Timeline Bar */}
          <div className="flex flex-col gap-2">
            <div className="relative w-full bg-muted/40 h-5 rounded-full overflow-hidden flex border border-border/50 p-[2px]">
              {hourlySlots.map((slot, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-full flex-1 border-r border-background/20 last:border-r-0 transition-all duration-300 first:rounded-l-full last:rounded-r-full cursor-help',
                    slot.status === 'available' &&
                      'bg-emerald-500/20 hover:bg-emerald-500/35 border-emerald-500/10',
                    slot.status === 'booked' &&
                      'bg-indigo-500 hover:bg-indigo-600 shadow-inner',
                    slot.status === 'pending' &&
                      'bg-amber-500 hover:bg-amber-600 animate-pulse',
                    slot.status === 'emergency' &&
                      'bg-rose-500 hover:bg-rose-600 shadow-inner',
                    slot.status === 'completed' &&
                      'bg-blue-500 hover:bg-blue-600',
                  )}
                  title={`${slot.label}: ${slot.status.toUpperCase()}${slot.booking ? ` (${slot.booking.operatorName})` : ''}`}
                />
              ))}
            </div>

            {/* Timeline Hour Labels */}
            <div className="flex justify-between text-[9px] font-mono font-bold text-muted-foreground/80 px-2 select-none">
              {hourlySlots
                .filter((_, i) => i % 2 === 0)
                .map((slot, index) => (
                  <span key={index}>{slot.label}</span>
                ))}
              <span>00:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Filter Toolbar */}
      <div className="flex flex-col gap-3 py-1 md:flex-row md:items-center justify-between border-t border-b border-border/30 my-1">
        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Status:
            </span>
            <Select
              value={activeBucket}
              onValueChange={(val: any) => {
                setActiveBucket(val)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className="w-[200px] h-10 bg-background text-xs font-semibold border-border/60">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Capability Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Capability:
            </span>
            <Select
              value={selectedUseCategory}
              onValueChange={handleUseCategoryChange}
            >
              <SelectTrigger className="w-[180px] h-10 bg-background text-xs font-semibold border-border/60">
                <SelectValue placeholder="All Capabilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Capabilities</SelectItem>
                <SelectItem value="planned_toal">Planned TOAL</SelectItem>
                <SelectItem value="emergency_recovery">
                  Emergency and recovery
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Selector & Reset */}
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          {/* Date Picker & Nav */}
          <div className="flex items-center gap-1.5 bg-background rounded-lg border border-border/60 p-1 shadow-sm shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted text-muted-foreground font-bold text-xs"
              onClick={() => {
                const current = new Date(timelineDate)
                current.setDate(current.getDate() - 1)
                const newD = format(current, 'yyyy-MM-dd')
                setSelectedDate(newD)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            >
              &larr;
            </Button>
            <input
              type="date"
              value={selectedDate === 'all' ? '' : selectedDate}
              onChange={(e) => {
                const val = e.target.value
                setSelectedDate(val || 'all')
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              className="h-8 px-2 bg-transparent text-xs font-semibold font-mono text-foreground focus-visible:outline-none cursor-pointer border-none"
            />
            {selectedDate !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSelectedDate('all')
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                }}
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted text-muted-foreground font-bold text-xs"
              onClick={() => {
                const current = new Date(timelineDate)
                current.setDate(current.getDate() + 1)
                const newD = format(current, 'yyyy-MM-dd')
                setSelectedDate(newD)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            >
              &rarr;
            </Button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-10 px-3 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground shrink-0 border border-dashed border-border/60"
            >
              <XCircle className="mr-1.5 h-4 w-4 text-muted-foreground/85" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Unified Bookings List Container */}
      <div className="w-full">
        <BookingList
          data={currentBookings}
          isLoading={isLoading}
          onReview={handleReview}
          onViewTimeline={handleViewTimeline}
          showReviewButton={true}
          pagination={pagination}
          onPaginationChange={setPagination}
          totalRows={paginationMeta?.total ?? currentBookings.length}
          totalPages={paginationMeta?.totalPages ?? 1}
        />
      </div>

      <BookingLifecycleModal
        booking={selectedTimelineBooking}
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
      />
    </div>
  )
}
