'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/use-auth-store'
import { adminService, AdminStatsResponse } from '@/services/admin.service'
import { Skeleton } from '@workspace/ui/components/skeleton'

// Import modular components
import PendingActionsCard from './components/PendingActionsCard'
import NetworkCompositionCard from './components/NetworkCompositionCard'
import NetworkRequestCard from './components/NetworkRequestCard'
import RecentRegistrationsCard from './components/RecentRegistrationsCard'
import RevenueGeneratedCard from './components/RevenueGeneratedCard'

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6 w-full animate-pulse">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-9 w-64 sm:h-10 bg-muted/65" />
      </div>

      {/* Grid: 4 Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border/40 p-5 space-y-4 bg-muted/5">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 bg-muted/60" />
              <Skeleton className="h-4 w-4 rounded-full bg-muted/60" />
            </div>
            <div className="space-y-3 pt-1">
              <Skeleton className="h-8.5 w-full rounded-lg bg-muted/55" />
              <Skeleton className="h-8.5 w-full rounded-lg bg-muted/55" />
              <Skeleton className="h-8.5 w-full rounded-lg bg-muted/55" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Chart Card */}
      <div className="rounded-xl border border-border/40 p-5 space-y-5 bg-muted/5">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-36 bg-muted/60" />
          <Skeleton className="h-4 w-4 rounded-full bg-muted/60" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-12 w-full rounded-lg bg-muted/55" />
          <Skeleton className="h-12 w-full rounded-lg bg-muted/55" />
          <Skeleton className="h-12 w-full rounded-lg bg-muted/55" />
        </div>
        <Skeleton className="h-[210px] w-full rounded-lg bg-muted/50" />
      </div>
    </div>
  )
}

export default function Page() {
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<AdminStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getStats()
        if (response.success) {
          setStats(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch admin stats', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  // Safe destructuring with fallbacks
  const pendingActions = stats?.pendingActions || {
    pendingAssetManagers: 0,
    pendingOperators: 0,
    pendingAssetReviews: 0,
  }

  const networkComposition = stats?.networkComposition || {
    assetManagers: 0,
    droneOperators: 0,
    activeAssets: 0,
  }

  const networkRequest = stats?.networkRequest || {
    submitted: 0,
    approved: 0,
    rejected: 0,
  }

  const recentRegistrations = stats?.recentRegistrations || {
    newAssetManagers30d: 0,
    newOperators30d: 0,
    newSites30d: 0,
  }

  const revenue = stats?.revenue || {
    totalRevenue: 0,
    subscriptionRevenue: 0,
    bookingRevenue: 0,
    revenueTrend: [],
  }

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6 w-full animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Welcome, {user?.firstName || 'User'} {user?.lastName || ''}
        </h1>
      </div>

      {/* Main Grid: Card 1 to 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PendingActionsCard
          pendingAssetManagers={pendingActions.pendingAssetManagers}
          pendingOperators={pendingActions.pendingOperators}
          pendingAssetReviews={pendingActions.pendingAssetReviews}
        />

        <NetworkCompositionCard
          assetManagers={networkComposition.assetManagers}
          droneOperators={networkComposition.droneOperators}
          activeAssets={networkComposition.activeAssets}
        />

        <NetworkRequestCard
          submitted={networkRequest.submitted}
          approved={networkRequest.approved}
          rejected={networkRequest.rejected}
        />

        <RecentRegistrationsCard
          newAssetManagers30d={recentRegistrations.newAssetManagers30d}
          newOperators30d={recentRegistrations.newOperators30d}
          newSites30d={recentRegistrations.newSites30d}
        />
      </div>

      {/* Revenue Section (Span full grid) */}
      <div className="grid grid-cols-1 gap-6">
        <RevenueGeneratedCard
          totalRevenue={revenue.totalRevenue}
          subscriptionRevenue={revenue.subscriptionRevenue}
          bookingRevenue={revenue.bookingRevenue}
          revenueTrend={revenue.revenueTrend}
        />
      </div>
    </div>
  )
}

