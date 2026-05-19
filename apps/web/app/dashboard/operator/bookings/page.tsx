'use client'

import * as React from 'react'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Button } from '@workspace/ui/components/button'
import { Plus, Compass, Loader2, AlertCircle } from 'lucide-react'
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
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
    const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false)
    const [bookingToCancel, setBookingToCancel] = React.useState<Booking | null>(null)

    // Fetch bookings on mount
    React.useEffect(() => {
        bookingService.listMyBookings()
            .then(setBookings)
            .catch((e) => setError(e?.message ?? 'Failed to load bookings'))
            .finally(() => setIsLoading(false))
    }, [])

    const upcomingBookings = bookings.filter(
        (b) => b.status === 'APPROVED' && new Date(b.endTime) > new Date(),
    )
    const pendingBookings = bookings.filter((b) => b.status === 'PENDING')
    const pastBookings = bookings.filter(
        (b) =>
            b.status === 'REJECTED' ||
            b.status === 'CANCELLED' ||
            (b.status === 'APPROVED' && new Date(b.endTime) <= new Date()),
    )

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
                        ? { ...b, status: 'CANCELLED', cancelledAt: new Date().toISOString() }
                        : b,
                ),
            )
            setIsCancelModalOpen(false)
            setIsDrawerOpen(false)
            toast.success(`Booking ${booking.bookingReference} cancelled successfully`)
        } catch (e: any) {
            toast.error(e?.message ?? 'Cancellation failed')
        }
    }

    const handleEmergencyResolve = async (booking: Booking, used: boolean) => {
        try {
            const updated = await bookingService.confirmEmergencyUsage(booking.id, used)
            setBookings((prev) =>
                prev.map((b) => (b.id === booking.id ? (updated as unknown as Booking) : b)),
            )
            toast.success(
                used
                    ? 'Emergency usage confirmed. Payment is processing.'
                    : 'No usage confirmed. No charge applied.',
            )
        } catch (e: any) {
            toast.error(e?.message ?? 'Failed to confirm emergency usage')
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
                            setError(null)
                            setIsLoading(true)
                            bookingService.listMyBookings()
                                .then(setBookings)
                                .catch((e) => setError(e?.message ?? 'Failed to load bookings'))
                                .finally(() => setIsLoading(false))
                        }}
                    >
                        Retry
                    </Button>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-1 items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium">Loading your bookings…</p>
                    </div>
                </div>
            )}

            {/* Emergency Incident Alert */}
            {!isLoading && unresolvedEmergency && (
                <EmergencyBanner
                    booking={unresolvedEmergency}
                    onResolve={handleEmergencyResolve}
                />
            )}

            {/* Workflow Tabs */}
            {!isLoading && !error && (
                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="bg-muted/30 p-1 mb-8 border border-border/40 inline-flex w-auto rounded-xl">
                        <TabsTrigger
                            value="upcoming"
                            className="px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                        >
                            Upcoming Flights
                            {upcomingBookings.length > 0 && (
                                <span className="ml-2 bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[8px]">
                                    {upcomingBookings.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="pending"
                            className="px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                        >
                            Pending Requests
                            {pendingBookings.length > 0 && (
                                <span className="ml-2 bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-md text-[8px]">
                                    {pendingBookings.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="past"
                            className="px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                        >
                            Logbook
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming" className="mt-0 outline-none">
                        <BookingTable
                            data={upcomingBookings}
                            isLoading={false}
                            onViewDetails={handleViewDetails}
                            onDownloadCertificate={handleDownloadCertificate}
                        />
                    </TabsContent>

                    <TabsContent value="pending" className="mt-0 outline-none">
                        <BookingTable
                            data={pendingBookings}
                            isLoading={false}
                            onViewDetails={handleViewDetails}
                        />
                    </TabsContent>

                    <TabsContent value="past" className="mt-0 outline-none">
                        <BookingTable
                            data={pastBookings}
                            isLoading={false}
                            onViewDetails={handleViewDetails}
                        />
                    </TabsContent>
                </Tabs>
            )}

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
