'use client'

import * as React from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { useAuthStore } from '@/store/use-auth-store'
import { bookingService } from '@/services/booking.service'
import { paymentService } from '@/services/payments/payment.service'
import { cn } from '@workspace/ui/lib/utils'

import { DashboardAlerts } from './components/dashboard-alerts'
import { DashboardMetrics } from './components/dashboard-metrics'
import { MissionRequestsCard } from './components/mission-requests-card'
import { TodaysOperationsCard } from './components/todays-operations-card'
import { NeedsAttentionCard } from './components/needs-attention-card'
import { ActionInboxCard } from './components/action-inbox-card'

const DashboardOperationsMap = dynamic(
  () =>
    import('./components/dashboard-operations-map').then(
      (m) => m.DashboardOperationsMap,
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

export default function Page() {
  const user = useAuthStore((state) => state.user)
  const isVerified =
    user?.verified ||
    user?.verificationStatus === 'APPROVED' ||
    user?.verificationStatus === 'VERIFIED' ||
    false
  const verificationStatus = user?.verificationStatus || ''

  const [isLoading, setIsLoading] = React.useState(true)
  const [hasPaymentMethod, setHasPaymentMethod] = React.useState(true)
  const [loadingPaymentCheck, setLoadingPaymentCheck] = React.useState(true)
  const [metrics, setMetrics] = React.useState({
    scheduledFlights: 0,
    pendingApprovals: 0,
    approvedConsents: 0,
    actionRequired: 0,
  })

  const [allBookings, setAllBookings] = React.useState<any[]>([])
  const [selectedBookingId, setSelectedBookingId] = React.useState<
    string | null
  >(null)
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [searchQuery, setSearchQuery] = React.useState<string>('')

  React.useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      try {
        setIsLoading(true)
        const bookings = await bookingService.listMyBookings()
        if (!mounted) return

        setAllBookings(bookings)

        const now = new Date()

        let scheduledFlights = 0
        let pendingApprovals = 0
        let approvedConsents = 0
        let actionRequired = 0

        for (const b of bookings) {
          const start = new Date(b.startTime)
          if (b.status === 'PENDING') {
            pendingApprovals++
          }

          if (b.status === 'APPROVED') {
            approvedConsents++
            if (start > now) {
              scheduledFlights++
            }
          }
        }

        if (!isVerified && verificationStatus !== 'PENDING') {
          actionRequired++
        }

        setMetrics({
          scheduledFlights,
          pendingApprovals,
          approvedConsents,
          actionRequired,
        })
      } catch (error) {
        console.error('Failed to load dashboard data', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      mounted = false
    }
  }, [isVerified, verificationStatus])

  React.useEffect(() => {
    let mounted = true
    async function checkPaymentMethods() {
      try {
        const methods = await paymentService.getPaymentMethods()
        if (mounted) {
          setHasPaymentMethod(methods && methods.length > 0)
        }
      } catch (err) {
        console.error('Failed to fetch payment methods', err)
      } finally {
        if (mounted) {
          setLoadingPaymentCheck(false)
        }
      }
    }
    void checkPaymentMethods()
    return () => {
      mounted = false
    }
  }, [])

  const SkeletonListItem = () => (
    <div className="flex items-center justify-between gap-4 p-5 border-b border-border/40 last:border-0">
      <div className="flex flex-col gap-2 w-full max-w-[200px] min-w-0">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md shrink-0" />
    </div>
  )

  const unresolvedEmergency = React.useMemo(() => {
    return allBookings.find(
      (b) =>
        b.useCategory === 'emergency_recovery' &&
        b.status === 'APPROVED' &&
        new Date(b.endTime) < new Date() &&
        (b.paymentStatus === 'authorized' || b.paymentStatus === 'pending') &&
        !b.clzConfirmedAt,
    )
  }, [allBookings])

  const handleResolveEmergency = React.useCallback((updatedBooking: any) => {
    setAllBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)),
    )
  }, [])

  const filteredBookings = React.useMemo(() => {
    return allBookings.filter((b) => {
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter
      const matchesSearch =
        !searchQuery ||
        (b.siteName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.bookingReference || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [allBookings, statusFilter, searchQuery])

  return (
    <div className="flex flex-1 flex-col gap-8 max-w-7xl mx-auto ">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user?.firstName || 'User'} {user?.lastName || ''}
        </h1>
      </div>

      {/* Action / Needs Attention Box */}
      {unresolvedEmergency && (
        <NeedsAttentionCard
          booking={unresolvedEmergency}
          onResolve={handleResolveEmergency}
        />
      )}

      {/* Global Alert Banners */}
      <DashboardAlerts
        loadingPaymentCheck={loadingPaymentCheck}
        hasPaymentMethod={hasPaymentMethod}
        verificationStatus={verificationStatus}
        isVerified={isVerified}
        user={user}
      />

      {/* At-a-Glance Metrics */}
      <DashboardMetrics isLoading={isLoading} metrics={metrics} />

      {/* Operations Map & List Sidepanel (Single Card) */}
      <Card className="flex flex-col border-border/60 shadow-md overflow-hidden p-0! h-[600px] lg:h-[650px] shrink-0">
        <CardHeader className="border-b border-border/40 bg-muted/30 py-3.5 px-4 shrink-0">
          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
            Operations Network Map
          </CardTitle>
        </CardHeader>
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Left Side: Map */}
          <div className="flex-1 min-h-[350px] lg:min-h-0 relative bg-muted/20 border-b lg:border-b-0 lg:border-r border-border/40">
            <DashboardOperationsMap
              bookings={filteredBookings}
              selectedBookingId={selectedBookingId}
              onSelectBooking={setSelectedBookingId}
              className="w-full h-full"
            />
          </div>

          {/* Right Side: Sidepanel Operations List */}
          <div className="w-full lg:w-[40%] flex flex-col h-full bg-background min-h-0 shrink-0 lg:shrink">
            {/* Filters Bar */}
            <div className="px-4 py-2.5 border-b border-border/40 bg-muted/5 flex gap-2 shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Site or Reference..."
                  className="w-full text-xs bg-background border border-border/60 rounded-md pl-3 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-background border border-border/60 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shrink-0"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVATED">Activated</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            {/* Operations List Container */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40 custom-scrollbar">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => {
                  const isSelected = booking.id === selectedBookingId
                  const startTime = new Date(booking.startTime)
                  const endTime = new Date(booking.endTime)
                  const dateStr = format(startTime, 'dd MMM yyyy')
                  const timeStr = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`

                  return (
                    <div
                      key={booking.id}
                      className={cn(
                        'p-4 transition-all duration-200 cursor-pointer flex flex-col gap-2 hover:bg-muted/5',
                        isSelected &&
                          'bg-primary/[0.03] border-l-2 border-primary',
                      )}
                      onClick={() =>
                        setSelectedBookingId(isSelected ? null : booking.id)
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground truncate">
                              {toTitleCase(booking.siteName || 'Unknown Site')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <span>Ref: {booking.bookingReference}</span>
                            <span>•</span>
                            <span>{dateStr}</span>
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            'text-[10px] font-semibold border-none px-2 py-0.5',
                            booking.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                              : booking.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                                : booking.status === 'ACTIVATED'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                  : booking.status === 'COMPLETED'
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
                          )}
                        >
                          {toTitleCase(booking.status)}
                        </Badge>
                      </div>

                      {/* Collapsible Details */}
                      {isSelected && (
                        <div className="mt-2 pt-3 border-t border-border/40 text-xs text-foreground space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/30">
                            <div>
                              <span className="text-[10px] text-muted-foreground block">
                                Time Slot
                              </span>
                              <span className="font-semibold">{timeStr}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground block">
                                Category
                              </span>
                              <Badge className="text-[9px] font-medium mt-0.5 bg-indigo-500 text-white border-none">
                                {booking.useCategory === 'planned_toal'
                                  ? 'Planned TOAL'
                                  : 'Emergency Recovery'}
                              </Badge>
                            </div>
                            {booking.droneModel && (
                              <div className="col-span-2">
                                <span className="text-[10px] text-muted-foreground block">
                                  Aircraft
                                </span>
                                <span className="font-medium">
                                  {booking.droneModel} ({booking.manufacturer})
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-[10px] text-muted-foreground block">
                                Access Fee
                              </span>
                              <span className="font-semibold">
                                £{(booking.toalCost ?? 0).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground block">
                                Payment Status
                              </span>
                              <span className="font-medium capitalize">
                                {booking.paymentStatus || 'Pending'}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs"
                              asChild
                            >
                              <Link
                                href={`/dashboard/operator/bookings/${booking.id}`}
                              >
                                View Full Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                  <p className="text-sm font-semibold text-foreground">
                    No Operations Found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                    Try adjusting your search query or filters, or book a new
                    flight.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Core Workflow (Split View) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MissionRequestsCard
          isLoading={isLoading}
          bookings={allBookings}
          SkeletonListItem={SkeletonListItem}
        />
        <TodaysOperationsCard
          isLoading={isLoading}
          bookings={allBookings}
          SkeletonListItem={SkeletonListItem}
        />
      </div>

      {/* Action Inbox */}
      <ActionInboxCard
        isLoading={isLoading}
        bookings={allBookings}
        SkeletonListItem={SkeletonListItem}
      />
    </div>
  )
}
