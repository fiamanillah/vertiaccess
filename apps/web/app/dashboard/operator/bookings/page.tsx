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
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
    const [pageMeta, setPageMeta] = React.useState({ totalPages: 1, totalRows: 0 })
    const [counts, setCounts] = React.useState({ upcoming: 0, pending: 0, past: 0 })
    const [unresolvedEmergency, setUnresolvedEmergency] = React.useState<Booking | null>(null)
    const [activeTab, setActiveTab] = React.useState<'upcoming' | 'pending' | 'past'>('upcoming')
    const [refreshKey, setRefreshKey] = React.useState(0)
    const [isLoading, setIsLoading] = React.useState(true)
    const [hasLoaded, setHasLoaded] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
    const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false)
    const [bookingToCancel, setBookingToCancel] = React.useState<Booking | null>(null)

    // Fetch bookings on mount + pagination changes
    React.useEffect(() => {
        let active = true
        setIsLoading(true)
        setError(null)

        bookingService
            .listMyBookingsPaginated({
                bucket: activeTab,
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                sort: 'createdAt',
                sortOrder: 'desc',
            })
            .then((response) => {
                if (!active) return
                setBookings(response.data)
                setPageMeta({
                    totalPages: Math.max(response.meta.pagination.totalPages, 1),
                    totalRows: response.meta.pagination.total,
                })
                if (response.meta.counts) {
                    setCounts(response.meta.counts)
                }
                setUnresolvedEmergency(response.meta.unresolvedEmergency ?? null)
            })
            .catch((e) => {
                if (!active) return
                setError(e?.message ?? 'Failed to load bookings')
            })
            .finally(() => {
                if (!active) return
                setIsLoading(false)
                setHasLoaded(true)
            })

        return () => {
            active = false
        }
    }, [activeTab, pagination.pageIndex, pagination.pageSize, refreshKey])

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
            setRefreshKey((prev) => prev + 1)
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
            setUnresolvedEmergency(null)
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
                        onClick={() => setRefreshKey((prev) => prev + 1)}
                    >
                        Retry
                    </Button>
                </div>
            )}

            {/* Loading State */}
            {isLoading && !hasLoaded && (
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
            {!error && (hasLoaded || !isLoading) && (
                <Tabs
                    value={activeTab}
                    onValueChange={(value) => {
                        setActiveTab(value as 'upcoming' | 'pending' | 'past')
                        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                        setPageMeta({ totalPages: 1, totalRows: 0 })
                    }}
                    className="w-full"
                >
                    <TabsList className="bg-muted/30 p-1 mb-8 border border-border/40 inline-flex w-auto rounded-xl">
                        <TabsTrigger
                            value="upcoming"
                            className="px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                        >
                            Upcoming Flights
                            {counts.upcoming > 0 && (
                                <span className="ml-2 bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[8px]">
                                    {counts.upcoming}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="pending"
                            className="px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                        >
                            Pending Requests
                            {counts.pending > 0 && (
                                <span className="ml-2 bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-md text-[8px]">
                                    {counts.pending}
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
                            data={activeTab === 'upcoming' ? bookings : []}
                            isLoading={isLoading && activeTab === 'upcoming'}
                            onViewDetails={handleViewDetails}
                            onDownloadCertificate={handleDownloadCertificate}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            totalPages={pageMeta.totalPages}
                            totalRows={pageMeta.totalRows}
                        />
                    </TabsContent>

                    <TabsContent value="pending" className="mt-0 outline-none">
                        <BookingTable
                            data={activeTab === 'pending' ? bookings : []}
                            isLoading={isLoading && activeTab === 'pending'}
                            onViewDetails={handleViewDetails}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            totalPages={pageMeta.totalPages}
                            totalRows={pageMeta.totalRows}
                        />
                    </TabsContent>

                    <TabsContent value="past" className="mt-0 outline-none">
                        <BookingTable
                            data={activeTab === 'past' ? bookings : []}
                            isLoading={isLoading && activeTab === 'past'}
                            onViewDetails={handleViewDetails}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            totalPages={pageMeta.totalPages}
                            totalRows={pageMeta.totalRows}
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
