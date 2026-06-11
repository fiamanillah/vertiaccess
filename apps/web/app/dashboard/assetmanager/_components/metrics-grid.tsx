'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Layers, Calendar, Users, Wallet } from 'lucide-react'
import { bookingService } from '@/services/booking.service'

export function MetricsGrid() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [metrics, setMetrics] = React.useState({
    infrastructureAssets: 0,
    scheduledOperations: 0,
    operatorsUsingAssets: 0,
    revenue: 0,
  })

  React.useEffect(() => {
    let mounted = true

    async function loadStats() {
      try {
        setIsLoading(true)
        const statsRes = await bookingService.getAssetManagerStats().catch(() => ({
          infrastructureAssets: 0,
          scheduledOperations: 0,
          operatorsUsingAssets: 0,
          revenue: 0,
        }))

        if (mounted) {
          setMetrics({
            infrastructureAssets: statsRes.infrastructureAssets || 0,
            scheduledOperations: statsRes.scheduledOperations || 0,
            operatorsUsingAssets: statsRes.operatorsUsingAssets || 0,
            revenue: statsRes.revenue || 0,
          })
        }
      } catch (error) {
        console.error('Failed to load asset manager stats', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadStats()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Infrastructure Assets */}
      <Link
        href="/dashboard/assetmanager/infrastructure"
        className="block transition-all duration-200 hover:scale-[1.005] active:scale-[0.995]"
      >
        <Card className="h-full border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Infrastructure assets
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                metrics.infrastructureAssets
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Scheduled Operations */}
      <Link
        href="/dashboard/assetmanager/scheduler"
        className="block transition-all duration-200 hover:scale-[1.005] active:scale-[0.995]"
      >
        <Card className="h-full border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Scheduled operations
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                metrics.scheduledOperations
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Operators Using Assets */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Operators using assets
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              metrics.operatorsUsingAssets
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue */}
      <Link
        href="/dashboard/assetmanager/balance"
        className="block transition-all duration-200 hover:scale-[1.005] active:scale-[0.995]"
      >
        <Card className="h-full border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                `£${Number(metrics.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
