'use client'

import { useEffect, useState } from 'react'
import { adminService } from '@/services/admin.service'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Button } from '@workspace/ui/components/button'
import { RefreshCw } from 'lucide-react'
import PlatformOverview from './components/PlatformOverview'
import TrendsAnalytics from './components/TrendsAnalytics'
import AssetAnalytics from './components/AssetAnalytics'
import OperatorAnalytics from './components/OperatorAnalytics'
import OperationsAnalytics from './components/OperationsAnalytics'
import IncidentAnalytics from './components/IncidentAnalytics'

export default function Page() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const response = await adminService.getAnalytics()
      if (response.success) {
        setData(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch admin analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-8 max-w-7xl mx-auto p-4 w-full">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Platform Overview Cards Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="border border-muted/60 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Trends Card Skeleton */}
        <div className="border border-muted/60 rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-[250px] w-full" />
        </div>

        {/* Asset Analytics Row Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border border-muted/60 rounded-xl p-6 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-60" />
            </div>
            <div className="flex items-center gap-6">
              <Skeleton className="h-[130px] w-[130px] rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
          <div className="border border-muted/60 rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-60" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="text-muted-foreground text-sm">Failed to Load Analytics Data.</span>
          <Button onClick={() => fetchAnalytics()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-8 max-w-7xl mx-auto p-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="gap-2 border-muted/60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Sections */}
      <PlatformOverview data={data.platformOverview} />

      <TrendsAnalytics data={data.trends} />

      <AssetAnalytics
        network={data.assetNetwork}
        capability={data.assetCapability}
        topAssets={data.topAssets}
      />

      <OperatorAnalytics
        topOperators={data.operatorAnalytics.topOperators}
        intentUsage={data.operatorAnalytics.missionIntentUsage}
        requested={data.operatorAnalytics.missionRequested}
      />

      <OperationsAnalytics
        performance={data.operationsAnalytics.approvalPerformance}
        modeUsage={data.operationsAnalytics.approvalModeUsage}
      />

      <IncidentAnalytics data={data.incidentSafety} />
    </div>
  )
}

