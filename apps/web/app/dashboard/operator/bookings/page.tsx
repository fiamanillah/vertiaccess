// apps/web/app/dashboard/operator/bookings/page.tsx
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
import { Plus, AlertCircle } from 'lucide-react'
import { BookingTable } from './components/booking-table'
import { BookingDetailDrawer } from './components/booking-detail-drawer'
import { CancellationModal } from './components/cancellation-modal'
import { EmergencyBanner } from './components/emergency-banner'
import type { Booking } from './types'
import { bookingService } from '@/services/booking.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function OperatorBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<
    'all' | Booking['status']
  >('all')
  const [categoryFilter, setCategoryFilter] = React.useState<
    'all' | Booking['useCategory']
  >('all')
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(
    null,
  )
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
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

  // Emergency booking that has ended and not yet resolved (authorized = card on file, not charged)
  const unresolvedEmergency = bookings.find(
    (b) =>
      b.useCategory === 'emergency_recovery' &&
      b.status === 'APPROVED' &&
      new Date(b.endTime) < new Date() &&
      (b.paymentStatus === 'authorized' || b.paymentStatus === 'pending') &&
      !b.clzConfirmedAt,
  )

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsDrawerOpen(true)
  }

  const handleCancelRequest = (booking: Booking) => {
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
      setIsDrawerOpen(false)
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

  const handleResubmit = (booking: Booking) => {
    router.push(`/dashboard/operator/search/${booking.siteId}`)
  }

  const handleDownloadCertificate = (booking: Booking) => {
    router.push(`/certificates/${booking.id}`)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Flight Itinerary
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Manage your missions & authorizations
          </p>
        </div>
        <Button
          className="font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/20"
          onClick={() => router.push('/dashboard/operator/search')}
        >
          <Plus className="h-4 w-4" />
          Book New Site
        </Button>
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
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
        <EmergencyBanner
          booking={unresolvedEmergency}
          onResolve={handleEmergencyResolve}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as typeof statusFilter)
            }
          >
            <SelectTrigger className="w-[150px]">
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
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Booking type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="planned_toal">Planned TOAL</SelectItem>
              <SelectItem value="emergency_recovery">
                Emergency standby
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setStatusFilter('all')
              setCategoryFilter('all')
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      <BookingTable
        data={bookings}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onDownloadCertificate={handleDownloadCertificate}
      />

      {/* Modals & Drawers */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCancel={handleCancelRequest}
        onResubmit={handleResubmit}
      />

      <CancellationModal
        booking={bookingToCancel}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancellation}
      />
    </div>
  )
}
