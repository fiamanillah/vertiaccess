'use client'

import * as React from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Button } from '@workspace/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Badge } from '@workspace/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  AlertCircle,
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

export default function LandownerBookingsPage() {
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
  const [activeTab, setActiveTab] = React.useState<
    'pending' | 'upcoming' | 'history'
  >('pending')
  const [bookingResponse, setBookingResponse] =
    React.useState<PaginatedBookingsResponse | null>(null)
  const [siteOptions, setSiteOptions] = React.useState<
    Array<{ id: string; name: string }>
  >([])
  const [error, setError] = React.useState<string | null>(null)

  const currentBookings = bookingResponse?.data ?? []
  const paginationMeta = bookingResponse?.meta.pagination
  const counts = bookingResponse?.meta.counts ?? {
    pending: 0,
    upcoming: 0,
    past: 0,
  }

  const currentBucket = React.useMemo(() => {
    if (activeTab === 'pending') return 'pending' as const
    if (activeTab === 'upcoming') return 'upcoming' as const
    return 'past' as const
  }, [activeTab])

  const getErrorMessage = (value: unknown) =>
    value instanceof Error ? value.message : 'Failed to load bookings'

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
        bucket: currentBucket,
        siteId: selectedSiteId === 'all' ? undefined : selectedSiteId,
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
    currentBucket,
    pagination.pageIndex,
    pagination.pageSize,
    selectedSiteId,
    updateSiteOptions,
  ])

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadBookings()
    })
  }, [loadBookings])

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'pending' | 'upcoming' | 'history')
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const handleSiteChange = (value: string) => {
    setSelectedSiteId(value)
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

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
      toast.success('Booking approved successfully')
      setIsDrawerOpen(false)
      setSelectedBooking(null)
      void loadBookings()
    } catch (value) {
      toast.error(getErrorMessage(value))
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
      toast.info('Booking rejected.')
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
            Access Control Center
          </h1>
          <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest mt-1">
            Inbox & Ledger Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/40 p-1.5 px-3 rounded-lg border border-border/50">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">
              Site:
            </span>
            <Select value={selectedSiteId} onValueChange={handleSiteChange}>
              <SelectTrigger className="h-7 w-45 bg-transparent border-none focus:ring-0 text-xs font-semibold">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>{siteSelectItems}</SelectContent>
            </Select>
          </div>
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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" /> Pending
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {counts.pending}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-muted-foreground font-medium">
              Requests awaiting landowner review
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
              <CalendarClock className="h-3 w-3" /> Upcoming
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {counts.upcoming}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Approved bookings still ahead
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> History
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {counts.past}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-muted-foreground font-medium">
              Completed, declined, and cancelled bookings
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="bg-muted/30 p-1 mb-6 border border-border/40 inline-flex w-auto">
          <TabsTrigger
            value="pending"
            className="relative  px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Needs Review
            {counts.pending > 0 && (
              <Badge className="ml-2 bg-red-500 hover:bg-red-600 text-white border-none h-5 min-w-5 p-0 flex items-center justify-center rounded-full text-[10px] font-bold animate-pulse">
                {counts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className=" px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Upcoming Access
            {counts.upcoming > 0 && (
              <Badge className="ml-2 bg-emerald-500 hover:bg-emerald-600 text-white border-none h-5 min-w-5 p-0 flex items-center justify-center rounded-full text-[10px] font-bold">
                {counts.upcoming}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className=" px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            History & Earnings
            {counts.past > 0 && (
              <Badge className="ml-2 bg-muted text-muted-foreground border-none h-5 min-w-5 p-0 flex items-center justify-center rounded-full text-[10px] font-bold">
                {counts.past}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="">
          <BookingList
            data={currentBookings}
            isLoading={isLoading}
            onReview={handleReview}
            onViewTimeline={handleViewTimeline}
            onDownloadCertificate={handleDownloadCertificate}
            showReviewButton
            pagination={pagination}
            onPaginationChange={setPagination}
            totalRows={paginationMeta?.total ?? currentBookings.length}
            totalPages={paginationMeta?.totalPages ?? 1}
          />
        </TabsContent>

        <TabsContent value="upcoming" className="">
          <BookingList
            data={currentBookings}
            isLoading={isLoading}
            onReview={handleReview}
            onViewTimeline={handleViewTimeline}
            onDownloadCertificate={handleDownloadCertificate}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalRows={paginationMeta?.total ?? currentBookings.length}
            totalPages={paginationMeta?.totalPages ?? 1}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <BookingList
            data={currentBookings}
            isLoading={isLoading}
            onReview={handleReview}
            onViewTimeline={handleViewTimeline}
            onDownloadCertificate={handleDownloadCertificate}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalRows={paginationMeta?.total ?? currentBookings.length}
            totalPages={paginationMeta?.totalPages ?? 1}
          />
        </TabsContent>
      </Tabs>

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
