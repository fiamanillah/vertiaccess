'use client'

import * as React from 'react'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { useAuthStore } from '@/store/use-auth-store'
import { bookingService } from '@/services/booking.service'
import { paymentService } from '@/services/payments/payment.service'

import { DashboardAlerts } from './components/dashboard-alerts'
import { DashboardMetrics } from './components/dashboard-metrics'
import { MissionRequestsCard } from './components/mission-requests-card'
import { TodaysOperationsCard } from './components/todays-operations-card'
import { ActionInboxCard } from './components/action-inbox-card'
import { ActivityLogCard } from './components/activity-log-card'
import { NeedsAttentionCard } from './components/needs-attention-card'

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

  return (
    <div className="flex flex-1 flex-col gap-8 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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

      {/* Restructured Layout - Row 2: Mission Requests & Today's Operations */}
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

      {/* Restructured Layout - Row 3: Action Inbox & Activity Log */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActionInboxCard
          isLoading={isLoading}
          bookings={allBookings}
          hasPaymentMethod={hasPaymentMethod}
          isVerified={isVerified}
          verificationStatus={verificationStatus}
          loadingPaymentCheck={loadingPaymentCheck}
          unresolvedEmergency={unresolvedEmergency}
        />
        <ActivityLogCard
          isLoading={isLoading}
          bookings={allBookings}
        />
      </div>
    </div>
  )
}
