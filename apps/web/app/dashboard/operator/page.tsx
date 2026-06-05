'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Inbox,
  Globe,
  MessageSquare,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'
import { useAuthStore } from '@/store/use-auth-store'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { bookingService } from '@/services/booking.service'

export default function Page() {
  const user = useAuthStore((state) => state.user)
  const isVerified =
    user?.verified ||
    user?.verificationStatus === 'APPROVED' ||
    user?.verificationStatus === 'VERIFIED' ||
    false
  const verificationStatus = user?.verificationStatus || ''

  const [isLoading, setIsLoading] = React.useState(true)
  const [metrics, setMetrics] = React.useState({
    scheduledFlights: 0,
    pendingApprovals: 0,
    approvedConsents: 0,
    actionRequired: 0,
  })

  const [needsAttention, setNeedsAttention] = React.useState<any[]>([])
  const [todaySchedule, setTodaySchedule] = React.useState<any[]>([])

  React.useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      try {
        setIsLoading(true)
        const bookings = await bookingService.listMyBookings()
        if (!mounted) return

        const now = new Date()

        let scheduledFlights = 0
        let pendingApprovals = 0
        let approvedConsents = 0
        let actionRequired = 0

        const attentionItems: any[] = []
        const todayItems: any[] = []

        for (const b of bookings) {
          const start = new Date(b.startTime)
          const end = new Date(b.endTime)
          const isToday =
            start.getFullYear() === now.getFullYear() &&
            start.getMonth() === now.getMonth() &&
            start.getDate() === now.getDate()

          if (b.status === 'PENDING') {
            pendingApprovals++
          }

          if (b.status === 'APPROVED') {
            approvedConsents++

            if (start > now) {
              scheduledFlights++
            }

            if (isToday) {
              todayItems.push({
                id: b.id,
                time: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
                siteName: b.siteName || 'Unknown Site',
                type:
                  b.useCategory === 'planned_toal'
                    ? 'Planned TOAL'
                    : 'Emergency and recovery',
                hasConsent: true,
              })
            }

            // Check for unresolved emergencies
            if (
              b.useCategory === 'emergency_recovery' &&
              end < now &&
              (b.paymentStatus === 'authorized' ||
                b.paymentStatus === 'pending') &&
              !b.clzConfirmedAt
            ) {
              actionRequired++
              attentionItems.push({
                id: b.id,
                type: 'flight_confirmation',
                title: 'Confirm flight completion',
                description: `${b.siteName} emergency window ended. Confirm TOAL details.`,
                action: 'Confirm Flight',
                link: '/dashboard/operator/bookings',
              })
            }
          }

          if (b.status === 'CANCELLED' && b.paymentStatus === 'failed') {
            attentionItems.push({
              id: b.id,
              type: 'action_required',
              title: 'Payment Failed',
              description: `Payment failed for ${b.siteName} booking.`,
              action: 'View Booking',
              link: '/dashboard/operator/bookings',
            })
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
        setNeedsAttention(attentionItems)
        setTodaySchedule(todayItems)
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

  const SkeletonListItem = () => (
    <div className="flex items-center justify-between gap-4 p-5 border-b border-border/40 last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <div className="space-y-2 w-full max-w-[200px]">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-8 w-24 rounded-md shrink-0" />
    </div>
  )

  return (
    <div className="flex flex-1 flex-col gap-8 max-w-7xl mx-auto p-2">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user?.firstName || 'User'} {user?.lastName || ''}
        </h1>
      </div>

      {/* Global Alert Banners based on Verification Status */}
      <div className="flex flex-col gap-3">
        {verificationStatus === 'BANNED' ? (
          <Alert
            variant="destructive"
            className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200"
          >
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            <div className="flex w-full items-center justify-between gap-4">
              <div className="space-y-1">
                <AlertTitle className="text-sm font-semibold">
                  Account Permanently Banned
                </AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-90 text-red-700 dark:text-red-300">
                  This account has been permanently banned from the VertiAccess
                  network due to severe policy or terms violations. Standard
                  platform operations have been terminated.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ) : verificationStatus === 'SUSPENDED' ? (
          <Alert
            variant="destructive"
            className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200"
          >
            <AlertTriangle className="h-5 w-5" />
            <div className="flex w-full items-center justify-between gap-4">
              <div className="space-y-1">
                <AlertTitle className="text-sm font-semibold">
                  Account Temporarily Suspended
                </AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-90 text-red-700 dark:text-red-300">
                  Reason:{' '}
                  {user?.suspendedReason ||
                    'Your account has been temporarily suspended by administrators. Please contact support.'}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ) : (
          !isVerified && (
            <>
              {verificationStatus === 'PENDING' ? (
                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="space-y-1">
                      <AlertTitle className="text-sm font-semibold">
                        Verification Under Review
                      </AlertTitle>
                      <AlertDescription className="text-xs font-medium opacity-90 text-amber-700 dark:text-amber-300">
                        We are currently reviewing your CAA Operator ID and
                        license documentation. You will receive an email once
                        approved.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ) : verificationStatus === 'REJECTED' ? (
                <Alert
                  variant="destructive"
                  className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="space-y-1">
                      <AlertTitle className="text-sm font-semibold">
                        Verification Rejected
                      </AlertTitle>
                      <AlertDescription className="text-xs font-medium opacity-90 text-red-700 dark:text-red-300">
                        Reason:{' '}
                        {user?.rejectionReason ||
                          'Your pilot registration credentials were not approved. Please review the comments and re-submit your details.'}
                      </AlertDescription>
                    </div>
                    <Button size="sm" variant="destructive" asChild>
                      <Link href="/dashboard/profile">
                        Fix Profile
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Alert>
              ) : (
                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200">
                  <UserCheck className="h-5 w-5 text-amber-600" />
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="space-y-1">
                      <AlertTitle className="text-sm font-semibold">
                        Verification Required
                      </AlertTitle>
                      <AlertDescription className="text-xs font-medium opacity-90 text-amber-700 dark:text-amber-300">
                        Please verify your pilot license and identity to unlock
                        flight booking options across our network.
                      </AlertDescription>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/dashboard/profile">
                        Verify Profile
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Alert>
              )}
            </>
          )
        )}
      </div>

      {/* At-a-Glance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Scheduled Flights */}
        <Link
          href="/dashboard/operator/bookings"
          className="block transition-all duration-200 hover:scale-[1.005] active:scale-[0.995]"
        >
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Scheduled flights
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-foreground">
                {isLoading ? (
                  <Skeleton className="h-9 w-12" />
                ) : (
                  metrics.scheduledFlights
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Pending Approvals */}
        <Link
          href="/dashboard/operator/bookings"
          className="block transition-all duration-200 hover:scale-[1.005] active:scale-[0.995]"
        >
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Pending approvals
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-foreground">
                {isLoading ? (
                  <Skeleton className="h-9 w-12" />
                ) : (
                  metrics.pendingApprovals
                )}
              </div>
            </CardContent>
          </Card>
        </Link>



        {/* Action Required */}
        <Link
          href="/dashboard/operator/incident-report"
          className="block transition-all duration-200 hover:scale-[1.005] active:scale-[0.995]"
        >
          <Card className="h-full border-border/60 shadow-sm bg-muted/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Action required
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-foreground">
                {isLoading ? (
                  <Skeleton className="h-9 w-12" />
                ) : (
                  metrics.actionRequired
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Core Workflow (Split View) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Needs Your Attention */}
        <Card className="flex flex-col border-border/60 shadow-md">
          <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                <Inbox className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Needs your attention
                </CardTitle>
                <CardDescription className="text-xs font-normal text-muted-foreground">
                  Action Inbox
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {isLoading ? (
              <div className="divide-y divide-border/40">
                <SkeletonListItem />
                <SkeletonListItem />
                <SkeletonListItem />
              </div>
            ) : needsAttention.length > 0 ? (
              <div className="divide-y divide-border/40">
                {needsAttention.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/5"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background shadow-sm">
                        {item.type === 'action_required' && (
                          <UserCheck className="h-4 w-4 text-primary" />
                        )}
                        {item.type === 'flight_confirmation' && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                        {item.type === 'admin_message' && (
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-none truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-border/60 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        asChild
                      >
                        <Link href={item.link}>
                          {item.action}
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[240px]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  All caught up!
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                  No items require your immediate attention right now.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Your Flights Today */}
        <Card className="flex flex-col border-border/60 shadow-md">
          <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Your flights today
                </CardTitle>
                <CardDescription className="text-xs font-normal text-muted-foreground">
                  Flight Ledger
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {isLoading ? (
              <div className="divide-y divide-border/40">
                <SkeletonListItem />
                <SkeletonListItem />
                <SkeletonListItem />
              </div>
            ) : todaySchedule.length > 0 ? (
              <div className="divide-y divide-border/40">
                {todaySchedule.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/5"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background shadow-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-none truncate">
                          {item.siteName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{item.type}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-border/60 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        asChild
                      >
                        <Link href={`/dashboard/operator/bookings`}>
                          View Details
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[240px]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No flights today
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                  No drone operations are scheduled for today.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
