'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { useAuthStore } from '@/store/use-auth-store'
import { adminService, AdminStatsResponse } from '@/services/admin.service'
import {
  Users,
  UserCheck,
  MapPin,
  AlertTriangle,
  FileCheck,
  Loader2,
  Activity,
} from 'lucide-react'

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
    return (
      <div className="flex flex-1 items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-8 max-w-7xl mx-auto p-4 w-full">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user?.firstName || 'User'} {user?.lastName || ''}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Verifications
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats?.pendingVerifications || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats?.activeSitesTotal || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Incidents
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats?.openIncidents || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>
              Recent activity overview across the VertiAccess network.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Active Users (30d)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Users active in the last 30 days
                  </p>
                </div>
                <div className="font-medium">
                  {stats?.activeUsersLast30Days || 0}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <UserCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Verified Profiles
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Successfully verified accounts
                  </p>
                </div>
                <div className="font-medium">
                  {(stats?.verifiedLandowners || 0) +
                    (stats?.verifiedOperators || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Site Features</CardTitle>
            <CardDescription>
              Breakdown of specialized site capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    CLZ Enabled Sites
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sites with Control Zone capabilities
                  </p>
                </div>
                <div className="font-medium">{stats?.sitesWithClz || 0}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Emergency Recovery Sites
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sites supporting emergency recovery
                  </p>
                </div>
                <div className="font-medium">
                  {stats?.emergencyRecoveryEnabledSites || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
