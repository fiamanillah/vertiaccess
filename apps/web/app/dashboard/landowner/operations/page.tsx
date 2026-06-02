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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  AlertCircle,
  Search,
  XCircle,
  Inbox,
  AlertTriangle,
} from 'lucide-react'
import { BookingList } from './components/booking-list'
import { BookingReviewDrawer } from './components/booking-review-drawer'
import { BookingLifecycleModal } from '@/app/dashboard/operator/bookings/components/booking-lifecycle-modal'
import { RejectionModal } from './components/rejection-modal'
import { Booking } from './types'
import { toast } from 'sonner'
import { bookingService } from '@/services/booking.service'
import type { PaginatedBookingsResponse } from '@/services/booking.types'
import { useRouter } from 'next/navigation'
import { Input } from '@workspace/ui/components/input'
import { cn } from '@workspace/ui/lib/utils'
import { format } from 'date-fns'

export default function LandownerOperationsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [selectedSiteId, setSelectedSiteId] = React.useState<string>('all')
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(
    null,
  )
  const [selectedTimelineBooking, setSelectedTimelineBooking] =
    React.useState<Booking | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [isTimelineOpen, setIsTimelineOpen] = React.useState(false)
  const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false)
  const [isActionSubmitting, setIsActionSubmitting] = React.useState(false)
  
  // Interactive category filter state (corresponds to active card)
  const [activeBucket, setActiveBucket] = React.useState<
    'pending' | 'upcoming' | 'completed' | 'denied'
  >('pending')

  // Unified Search, Operation Type and Date filter states
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState<string>('')
  const [selectedUseCategory, setSelectedUseCategory] = React.useState<string>('all')
  const [selectedDate, setSelectedDate] = React.useState<string>('all')

  const [bookingResponse, setBookingResponse] =
    React.useState<PaginatedBookingsResponse | null>(null)
  const [siteOptions, setSiteOptions] = React.useState<
    Array<{ id: string; name: string }>
  >([])
  const [error, setError] = React.useState<string | null>(null)

  // Timeline-specific bookings state to show visual occupancy track
  const [timelineBookings, setTimelineBookings] = React.useState<Booking[]>([])

  const currentBookings = bookingResponse?.data ?? []
  const paginationMeta = bookingResponse?.meta.pagination
  const counts = bookingResponse?.meta.counts ?? {
    pending: 0,
    upcoming: 0,
    past: 0,
    completed: 0,
    denied: 0,
  }

  const completedCount = counts.completed ?? 0
  const deniedCount = counts.denied ?? 0

  // Resolve active date for the visual timeline (always falls back to today if 'all' is selected)
  const timelineDate = React.useMemo(() => {
    return selectedDate === 'all' ? format(new Date(), 'yyyy-MM-dd') : selectedDate
  }, [selectedDate])

  // Debounce search input to avoid redundant API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const getErrorMessage = (value: unknown) =>
    value instanceof Error ? value.message : 'Failed to load operations'

  const updateSiteOptions = React.useCallback(
    (bookings: Array<{ siteId: string; siteName: string | null }>) => {
      setSiteOptions((current) => {
        const next = new Map(current.map((site) => [site.id, site]))
        bookings.forEach((booking) => {
          if (booking.siteId && booking.siteName) {
            next.set(booking.siteId, {
              id: booking.siteId,
              name: booking.siteName,
            })
          }
        })
        return Array.from(next.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        )
      })
    },
    [],
  )

  const loadBookings = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await bookingService.listLandownerBookings({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        bucket: activeBucket,
        siteId: selectedSiteId === 'all' ? undefined : selectedSiteId,
        useCategory: selectedUseCategory === 'all' ? undefined : selectedUseCategory,
        search: debouncedSearchQuery || undefined,
        date: selectedDate === 'all' ? undefined : selectedDate,
      })

      setBookingResponse(response)
      updateSiteOptions(response.data)
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
    selectedSiteId,
    selectedUseCategory,
    debouncedSearchQuery,
    selectedDate,
    updateSiteOptions,
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
        const response = await bookingService.listLandownerBookings({
          limit: 100, // Load all items for the timeline visualization
          date: timelineDate,
          siteId: selectedSiteId === 'all' ? undefined : selectedSiteId,
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
  }, [timelineDate, selectedSiteId])

  // Construct segmented hourly slots for 05:00 to 00:00 (next day)
  const hourlySlots = React.useMemo(() => {
    const hours = Array.from({ length: 20 }, (_, i) => 5 + i) // 05:00 to 24:00 (which is 00:00)
    
    return hours.map((hour) => {
      const parts = timelineDate.split('-')
      const year = Number(parts[0]) || new Date().getFullYear()
      const month = Number(parts[1]) || (new Date().getMonth() + 1)
      const day = Number(parts[2]) || new Date().getDate()
      const slotStart = new Date(year, month - 1, day, hour, 0, 0, 0)
      const slotEnd = new Date(year, month - 1, day, hour + 1, 0, 0, 0)

      const overlapping = timelineBookings.find((b) => {
        const bStart = new Date(b.startTime)
        const bEnd = new Date(b.endTime)
        return bStart < slotEnd && bEnd > slotStart
      })

      let status: 'available' | 'booked' | 'pending' | 'completed' = 'available'
      if (overlapping) {
        if (overlapping.status === 'PENDING') {
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

  const handleSiteChange = (value: string) => {
    setSelectedSiteId(value)
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const handleUseCategoryChange = (value: string) => {
    setSelectedUseCategory(value)
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const handleClearFilters = () => {
    setSelectedSiteId('all')
    setSelectedUseCategory('all')
    setSearchQuery('')
    setSelectedDate('all')
    setActiveBucket('pending')
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const hasActiveFilters =
    selectedSiteId !== 'all' ||
    selectedUseCategory !== 'all' ||
    searchQuery !== '' ||
    selectedDate !== 'all' ||
    activeBucket !== 'pending'

  const handleReview = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsDrawerOpen(true)
  }

  const handleViewTimeline = (booking: Booking) => {
    setSelectedTimelineBooking(booking)
    setIsTimelineOpen(true)
  }

  const handleApprove = async (id: string) => {
    setIsActionSubmitting(true)
    try {
      await bookingService.updateBookingStatus(id, 'APPROVED')
      toast.success('Operation approved successfully')
      setIsDrawerOpen(false)
      setSelectedBooking(null)
      void loadBookings()
    } catch (value) {
      const msg = getErrorMessage(value)
      const isPaymentError =
        msg.toLowerCase().includes('payment') ||
        msg.toLowerCase().includes('card') ||
        msg.toLowerCase().includes('payment method')
      if (isPaymentError) {
        toast.error(
          `Approval blocked — operator has no payment method on file. ${msg}`,
          { duration: 6000 },
        )
      } else {
        toast.error(msg)
      }
    } finally {
      setIsActionSubmitting(false)
    }
  }

  const handleRejectClick = () => {
    setIsRejectionModalOpen(true)
  }

  const handleConfirmReject = async (reason: string) => {
    setIsActionSubmitting(true)
    try {
      if (!selectedBooking) return
      await bookingService.updateBookingStatus(
        selectedBooking.id,
        'REJECTED',
        reason,
      )
      toast.info('Operation rejected.')
      setIsRejectionModalOpen(false)
      setIsDrawerOpen(false)
      setSelectedBooking(null)
      void loadBookings()
    } catch (value) {
      toast.error(getErrorMessage(value))
    } finally {
      setIsActionSubmitting(false)
    }
  }

  const handleDownloadCertificate = React.useCallback(
    (booking: Booking) => {
      router.push(`/certificates/${booking.id}`)
    },
    [router],
  )

  const siteSelectItems = [
    <SelectItem key="all" value="all">
      All Sites
    </SelectItem>,
    ...siteOptions.map((site) => (
      <SelectItem key={site.id} value={site.id}>
        {site.name}
      </SelectItem>
    )),
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Operations Control Hub
          </h1>
          <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest mt-1">
            Flight Authorisations & Activity Ledger
          </p>
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

      {/* ── Unified Operations Command Center ── */}
      <Card className="border-border/60 bg-card shadow-md overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* ─ Card Header: Title + Date Nav ─ */}
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <CardTitle className="text-base font-bold tracking-tight">Operations Command Center</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Manage authorisations &amp; track activity for {selectedSiteId === 'all' ? 'all registered sites' : 'selected site'}
              </p>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-1 bg-background rounded-lg border border-border/60 p-1 shadow-sm shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted text-muted-foreground font-bold text-xs"
                onClick={() => {
                  const current = new Date(timelineDate)
                  current.setDate(current.getDate() - 1)
                  setSelectedDate(format(current, 'yyyy-MM-dd'))
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                }}
              >
                &larr;
              </Button>
              <div className="px-3 text-xs font-mono font-bold text-foreground">
                {format(new Date(timelineDate.replace(/-/g, '/')), 'dd MMM yyyy')}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted text-muted-foreground font-bold text-xs"
                onClick={() => {
                  const current = new Date(timelineDate)
                  current.setDate(current.getDate() + 1)
                  setSelectedDate(format(current, 'yyyy-MM-dd'))
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                }}
              >
                &rarr;
              </Button>
            </div>
          </div>

          {/* ─ Category Filter Pills ─ */}
          <div className="flex items-center gap-2 pt-5 pb-4 overflow-x-auto scrollbar-none -mx-6 px-6">
            {/* Access Requests */}
            <button
              onClick={() => {
                setActiveBucket('pending')
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0",
                activeBucket === 'pending'
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 shadow-sm shadow-amber-500/10"
                  : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50 hover:border-border"
              )}
            >
              <Inbox className="h-3.5 w-3.5" />
              <span>Access Requests</span>
              <span className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black tabular-nums",
                activeBucket === 'pending'
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                  : "bg-muted/60 text-muted-foreground"
              )}>
                {counts.pending}
              </span>
            </button>

            {/* Scheduled Operations */}
            <button
              onClick={() => {
                setActiveBucket('upcoming')
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0",
                activeBucket === 'upcoming'
                  ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                  : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50 hover:border-border"
              )}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              <span>Scheduled</span>
              <span className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black tabular-nums",
                activeBucket === 'upcoming'
                  ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                  : "bg-muted/60 text-muted-foreground"
              )}>
                {counts.upcoming}
              </span>
            </button>

            {/* Completed Operations */}
            <button
              onClick={() => {
                setActiveBucket('completed')
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0",
                activeBucket === 'completed'
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                  : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50 hover:border-border"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Completed</span>
              <span className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black tabular-nums",
                activeBucket === 'completed'
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted/60 text-muted-foreground"
              )}>
                {completedCount}
              </span>
            </button>

            {/* Denied Operations */}
            <button
              onClick={() => {
                setActiveBucket('denied')
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0",
                activeBucket === 'denied'
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 shadow-sm shadow-rose-500/10"
                  : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50 hover:border-border"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Denied</span>
              <span className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black tabular-nums",
                activeBucket === 'denied'
                  ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                  : "bg-muted/60 text-muted-foreground"
              )}>
                {deniedCount}
              </span>
            </button>
          </div>
        </CardHeader>

        <div className="border-t border-border/40" />

        {/* ─ Timeline Visualization ─ */}
        <CardContent className="py-5 flex flex-col gap-4">
          {/* Legend Row */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Hourly Occupancy</span>
            <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500/35 border border-emerald-500/30" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Pending</span>
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
                    "h-full flex-1 border-r border-background/20 last:border-r-0 transition-all duration-300 first:rounded-l-full last:rounded-r-full cursor-help",
                    slot.status === 'available' && "bg-emerald-500/20 hover:bg-emerald-500/35 border-emerald-500/10",
                    slot.status === 'booked' && "bg-indigo-500 hover:bg-indigo-600 shadow-inner",
                    slot.status === 'pending' && "bg-amber-500 hover:bg-amber-600 animate-pulse",
                    slot.status === 'completed' && "bg-blue-500 hover:bg-blue-600",
                  )}
                  title={`${slot.label}: ${slot.status.toUpperCase()}${slot.booking ? ` (${slot.booking.operatorName})` : ''}`}
                />
              ))}
            </div>

            {/* Timeline Hour Labels */}
            <div className="flex justify-between text-[9px] font-mono font-bold text-muted-foreground/80 px-2 select-none">
              {hourlySlots.filter((_, i) => i % 2 === 0).map((slot, index) => (
                <span key={index}>{slot.label}</span>
              ))}
              <span>00:00</span>
            </div>
          </div>

          {/* Quick Details of the day's flights */}
          {timelineBookings.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 mt-1">
              {timelineBookings.map((b) => {
                const bStart = new Date(b.startTime)
                const bEnd = new Date(b.endTime)
                return (
                  <div
                    key={b.id}
                    className={cn(
                      "flex flex-col gap-1.5 p-3 rounded-lg border text-xs transition-colors cursor-pointer",
                      b.status === 'PENDING'
                        ? "bg-amber-500/[0.02] border-amber-500/20 hover:bg-amber-500/[0.04]"
                        : b.status === 'APPROVED'
                          ? new Date(b.endTime) < new Date()
                            ? "bg-blue-500/[0.02] border-blue-500/20 hover:bg-blue-500/[0.04]"
                            : "bg-indigo-500/[0.02] border-indigo-500/20 hover:bg-indigo-500/[0.04]"
                          : "bg-muted/10 border-border/40"
                    )}
                    onClick={() => handleReview(b)}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-foreground truncate max-w-[150px]">{b.operatorName}</span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase",
                        b.status === 'PENDING' && "bg-amber-100 text-amber-800",
                        b.status === 'APPROVED' && (new Date(b.endTime) < new Date() ? "bg-blue-100 text-blue-800" : "bg-indigo-100 text-indigo-800"),
                        b.status === 'REJECTED' && "bg-red-100 text-red-800",
                      )}>
                        {b.status === 'APPROVED' && new Date(b.endTime) < new Date() ? 'COMPLETED' : b.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                      <span>{format(bStart, 'HH:mm')} - {format(bEnd, 'HH:mm')}</span>
                      <span className="truncate max-w-[120px]">{b.siteName}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4 bg-muted/10 rounded-lg border border-dashed border-border/50">
              <p className="text-xs text-muted-foreground">No operations scheduled for this date.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modern Filter Toolbar */}
      <div className="flex flex-col gap-4 bg-muted/20 p-4 rounded-xl border border-border/40 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by operator, site, or reference..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
            className="pl-9 h-10 bg-background border-border/60 focus-visible:ring-primary/20 text-sm"
          />
        </div>

        {/* Filters Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker Filter */}
          <div className="flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={selectedDate === 'all' ? '' : selectedDate}
              onChange={(e) => {
                const val = e.target.value
                setSelectedDate(val || 'all')
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              className="h-10 px-3 bg-background border border-border/60 rounded-md text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Select value={selectedSiteId} onValueChange={handleSiteChange}>
              <SelectTrigger className="w-[180px] h-10 bg-background text-xs font-semibold border-border/60">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>{siteSelectItems}</SelectContent>
            </Select>
          </div>

          <Select value={selectedUseCategory} onValueChange={handleUseCategoryChange}>
            <SelectTrigger className="w-[180px] h-10 bg-background text-xs font-semibold border-border/60">
              <SelectValue placeholder="All Operation Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="planned_toal">Planned TOAL</SelectItem>
              <SelectItem value="emergency_recovery">Emergency Standby</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-10 px-3 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground shrink-0"
            >
              <XCircle className="mr-1.5 h-4 w-4 text-muted-foreground/85" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Unified Bookings List Container */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden p-1">
        <BookingList
          data={currentBookings}
          isLoading={isLoading}
          onReview={handleReview}
          onViewTimeline={handleViewTimeline}
          onDownloadCertificate={handleDownloadCertificate}
          showReviewButton={activeBucket === 'pending'}
          pagination={pagination}
          onPaginationChange={setPagination}
          totalRows={paginationMeta?.total ?? currentBookings.length}
          totalPages={paginationMeta?.totalPages ?? 1}
        />
      </div>

      {/* Slide-over Drawer */}
      <BookingReviewDrawer
        booking={selectedBooking}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApprove={handleApprove}
        onReject={handleRejectClick}
      />

      <BookingLifecycleModal
        booking={selectedTimelineBooking}
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
      />

      {/* Rejection Reason Modal */}
      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={handleConfirmReject}
        isSubmitting={isActionSubmitting}
      />
    </div>
  )
}
