'use client'

import * as React from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Button } from '@workspace/ui/components/button'
import { Plus, Compass } from 'lucide-react'
import { BookingTable } from './components/booking-table'
import { BookingDetailDrawer } from './components/booking-detail-drawer'
import { CancellationModal } from './components/cancellation-modal'
import { EmergencyBanner } from './components/emergency-banner'
import { Booking } from './types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const mockBookings: Booking[] = [
  {
    id: '1',
    vtId: 'vt-bkg-123',
    bookingReference: 'VA-BKG-X87K2P19',
    operatorId: 'op-1',
    siteId: 'site-1',
    siteName: 'Canary Wharf Helipad',
    siteAddress: 'South Quay, London, E14 9WS',
    sitePhotoUrl: null,
    latitude: 51.5023,
    longitude: -0.0193,
    toalRadius: 150,
    emergencyRadius: 300,
    showEmergency: true,
    toalMode: 'circle',
    emergencyMode: 'circle',
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 90000000).toISOString(),
    operationReference: 'OPS-2024-001',
    droneModel: 'DJI Matrice 350 RTK',
    missionIntent: 'Critical structural inspection of helipad infrastructure.',
    useCategory: 'planned_toal',
    flyerId: 'GBR-RP-123456',
    toalCost: 125.0,
    platformFee: 5.0,
    paymentMethodLast4: '4242',
    paymentMethodBrand: 'Visa',
    status: 'APPROVED',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString(),
    respondedAt: new Date().toISOString(),
    cancelledAt: null,
  },
  {
    id: '2',
    vtId: 'vt-bkg-124',
    bookingReference: 'VA-BKG-J92L5Q08',
    operatorId: 'op-1',
    siteId: 'site-2',
    siteName: 'Manchester City Vertiport',
    siteAddress: 'Deansgate, Manchester, M3 4LQ',
    sitePhotoUrl: null,
    latitude: 53.4808,
    longitude: -2.2426,
    toalRadius: 200,
    emergencyRadius: 400,
    showEmergency: false,
    toalMode: 'circle',
    emergencyMode: 'circle',
    startTime: new Date(Date.now() + 172800000).toISOString(), // 2 days later
    endTime: new Date(Date.now() + 176400000).toISOString(),
    operationReference: 'OPS-2024-002',
    droneModel: 'Autel EVO II Pro',
    missionIntent: 'Aerial cinematography for real estate promo.',
    useCategory: 'planned_toal',
    flyerId: 'GBR-RP-123456',
    toalCost: 85.0,
    platformFee: 5.0,
    paymentMethodLast4: '4242',
    paymentMethodBrand: 'Visa',
    status: 'PENDING',
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    respondedAt: null,
    cancelledAt: null,
  },
  {
    id: '3',
    vtId: 'vt-bkg-125',
    bookingReference: 'VA-BKG-K33P1A22',
    operatorId: 'op-1',
    siteId: 'site-3',
    siteName: 'North Field Estate',
    siteAddress: 'Aylesbury, Buckinghamshire, HP19 8AL',
    sitePhotoUrl: null,
    latitude: 51.8156,
    longitude: -0.8123,
    toalRadius: 250,
    emergencyRadius: 500,
    showEmergency: true,
    toalMode: 'circle',
    emergencyMode: 'circle',
    startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    endTime: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
    operationReference: 'OPS-2024-003',
    droneModel: 'DJI Mavic 3 Enterprise',
    missionIntent: 'Emergency technical survey post-storm.',
    useCategory: 'emergency_recovery',
    flyerId: 'GBR-RP-123456',
    toalCost: 150.0,
    platformFee: 0,
    paymentMethodLast4: '4242',
    paymentMethodBrand: 'Visa',
    status: 'APPROVED',
    paymentStatus: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    respondedAt: new Date(Date.now() - 86000000).toISOString(),
    cancelledAt: null,
  },
  {
    id: '4',
    vtId: 'vt-bkg-126',
    bookingReference: 'VA-BKG-E44R9B11',
    operatorId: 'op-1',
    siteId: 'site-4',
    siteName: 'Birmingham Tech Park',
    siteAddress: 'Aston, Birmingham, B7 4BB',
    sitePhotoUrl: null,
    latitude: 52.4862,
    longitude: -1.8904,
    toalRadius: 180,
    emergencyRadius: 350,
    showEmergency: true,
    toalMode: 'circle',
    emergencyMode: 'circle',
    startTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    endTime: new Date(Date.now() - 170000000).toISOString(),
    operationReference: 'OPS-2024-004',
    droneModel: 'DJI Inspire 3',
    missionIntent: 'Solar panel thermal mapping.',
    useCategory: 'planned_toal',
    flyerId: 'GBR-RP-123456',
    toalCost: 110.0,
    platformFee: 5.5,
    paymentMethodLast4: '4242',
    paymentMethodBrand: 'Visa',
    status: 'REJECTED',
    paymentStatus: 'refunded',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    respondedAt: new Date(Date.now() - 250000000).toISOString(),
    cancelledAt: null,
    adminNote:
      'Message from Landowner: Please redraw your flight path, it overlaps with the cattle field on the east side.',
  },
]

export default function OperatorBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = React.useState<Booking[]>(mockBookings)
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(
    null,
  )
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false)
  const [bookingToCancel, setBookingToCancel] = React.useState<Booking | null>(
    null,
  )

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

  const unresolvedEmergency = bookings.find(
    (b) =>
      b.useCategory === 'emergency_recovery' &&
      b.status === 'APPROVED' &&
      new Date(b.endTime) < new Date() &&
      b.paymentStatus === 'pending',
  )

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsDrawerOpen(true)
  }

  const handleCancelRequest = (booking: Booking) => {
    setBookingToCancel(booking)
    setIsCancelModalOpen(true)
  }

  const confirmCancellation = (booking: Booking) => {
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
  }

  const handleEmergencyResolve = (booking: Booking, used: boolean) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? { ...b, paymentStatus: used ? 'paid' : 'refunded' }
          : b,
      ),
    )
    toast.success(
      used
        ? 'Emergency usage confirmed. Processing payment.'
        : 'No usage confirmed. Reservation released.',
    )
  }

  const handleResubmit = (booking: Booking) => {
    toast.info(`Redirecting to booking flow for ${booking.bookingReference}...`)
    // In a real app: router.push(`/dashboard/operator/search/${booking.siteId}?resubmit=${booking.id}`);
  }

  const handleDownloadCertificate = (booking: Booking) => {
    router.push(`/certificates/${booking.id}`)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Flight Itinerary
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Manage your missions & authorizations
          </p>
        </div>
        <Button className="font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          Book New Site
        </Button>
      </div>

      {/* Emergency Incident Alert */}
      {unresolvedEmergency && (
        <EmergencyBanner
          booking={unresolvedEmergency}
          onResolve={handleEmergencyResolve}
        />
      )}

      {/* Workflow Tabs */}
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
