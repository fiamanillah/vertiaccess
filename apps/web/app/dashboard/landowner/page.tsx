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
  Wallet,
  UserCheck,
  Inbox,
  Globe,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'
import { useAuthStore } from '@/store/use-auth-store'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { bookingService } from '@/services/booking.service'
import { siteService } from '@/services/site.service'
import { paymentService } from '@/services/payments/payment.service'

interface AttentionItem {
  id: string
  type: 'booking_request' | 'emergency_confirmation'
  title: string
  description: string
  action: string
  link: string
}

interface ScheduleItem {
  id: string
  time: string
  operator: string
  type: string
  hasCertificate: boolean
}

interface SiteItem {
  status: string
}

function SkeletonListItem() {
  return (
    <div className="flex items-center justify-between gap-4 p-5 border-b border-border/40 last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <div className="space-y-2 w-full max-w-50">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-8 w-24 rounded-md shrink-0" />
    </div>
  )
}

export default function Page() {
  const user = useAuthStore((state) => state.user)
  const isIdVerified = user?.verified || user?.verificationStatus === 'APPROVED' || user?.verificationStatus === 'VERIFIED' || false
  const verificationStatus = user?.verificationStatus || ''
  const [isStripeConnected, setIsStripeConnected] = React.useState(true)

  const [isLoading, setIsLoading] = React.useState(true)
  const [metrics, setMetrics] = React.useState({
    pendingRequests: 0,
    availableEarnings: 0,
    activeSites: 0,
    actionRequired: 0,
  })

  const [needsAttention, setNeedsAttention] = React.useState<AttentionItem[]>(
    [],
  )
  const [todaySchedule, setTodaySchedule] = React.useState<ScheduleItem[]>([])

  React.useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      try {
        setIsLoading(true)

        const [pendingBookingsRes, upcomingBookingsRes, balanceRes, sitesRes] =
          await Promise.all([
            bookingService.listLandownerBookings({
              bucket: 'pending',
              limit: 5,
            }),
            bookingService.listLandownerBookings({
              bucket: 'upcoming',
              limit: 20,
            }),
            paymentService.getLandownerBalance().catch(() => {
              if (mounted) setIsStripeConnected(false)
              return { availableBalance: 0 }
            }),
            siteService.listSites().catch(() => ({ success: false, data: [] })),
          ])

        if (!mounted) return

        const now = new Date()

        const pendingRequests: number =
          pendingBookingsRes?.meta?.counts?.pending || 0
        const availableEarnings: number = Number(
          balanceRes?.availableBalance || 0,
        )

        let activeSites = 0
        if (sitesRes?.success && sitesRes?.data) {
          activeSites = (sitesRes.data as SiteItem[]).filter(
            (s) => s.status === 'ACTIVE',
          ).length
        }

        let actionRequired = 0

        const attentionItems: AttentionItem[] = []
        const todayItems: ScheduleItem[] = []

        // Needs Attention: pending bookings
        for (const b of pendingBookingsRes?.data || []) {
          const start = new Date(b.startTime)
          attentionItems.push({
            id: b.id,
            type: 'booking_request',
            title: `${b.operatorName} requested ${b.useCategory === 'planned_toal' ? 'Planned TOAL' : 'Emergency Standby'}`,
            description: `${b.siteName} for ${start.toLocaleDateString()} at ${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
            action: 'Review Request',
            link: '/dashboard/landowner/bookings',
          })
        }

        // Today Schedule: from upcoming bookings
        for (const b of upcomingBookingsRes?.data || []) {
          const start = new Date(b.startTime)
          const end = new Date(b.endTime)
          const isToday =
            start.getFullYear() === now.getFullYear() &&
            start.getMonth() === now.getMonth() &&
            start.getDate() === now.getDate()

          if (isToday) {
            todayItems.push({
              id: b.id,
              time: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
              operator: b.operatorName || 'Operator',
              type:
                b.useCategory === 'planned_toal'
                  ? 'Planned TOAL'
                  : 'Emergency Standby',
              hasCertificate: true,
            })
          }
        }

        if (!isIdVerified && verificationStatus !== 'PENDING') {
          actionRequired++
        }

        if (!isStripeConnected) {
          actionRequired++
        }

        setMetrics({
          pendingRequests,
          availableEarnings,
          activeSites,
          actionRequired,
        })
        setNeedsAttention(attentionItems.slice(0, 5))
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
  }, [isIdVerified, verificationStatus, isStripeConnected])

  return (
    <div className="flex flex-1 flex-col gap-8 max-w-7xl mx-auto p-4">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Landowner Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back, {user?.firstName || 'Landowner'}. Manage your drone sites and earnings.
        </p>
      </div>

      {/* Global Alert Banners (Morning Briefing) */}
      <div className="flex flex-col gap-3">
        {!isStripeConnected && (
          <Alert
            variant="destructive"
            className=" border-destructive/50 bg-destructive/5 "
          >
            <Wallet className="h-5 w-5" />
            <div className="flex w-full items-center justify-between gap-4">
              <div className="space-y-1">
                <AlertTitle className="text-sm font-black uppercase tracking-widest">
                  Action Required: Payouts Disabled
                </AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-90">
                  Connect your bank account via Stripe to receive payouts for
                  your approved drone operations.
                </AlertDescription>
              </div>
              <Button size="sm" variant="destructive" asChild>
                <Link href="/dashboard/landowner/balance">
                  Connect Stripe
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Alert>
        )}

        {verificationStatus === 'BANNED' ? (
          <Alert
            variant="destructive"
            className="border-destructive/50 bg-destructive/5"
          >
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            <div className="flex w-full items-center justify-between gap-4">
              <div className="space-y-1">
                <AlertTitle className="text-sm font-black uppercase tracking-widest">
                  Account Permanently Banned
                </AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-90">
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
            className="border-destructive/50 bg-destructive/5"
          >
            <AlertTriangle className="h-5 w-5" />
            <div className="flex w-full items-center justify-between gap-4">
              <div className="space-y-1">
                <AlertTitle className="text-sm font-black uppercase tracking-widest">
                  Account Temporarily Suspended
                </AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-90">
                  Reason:{' '}
                  {user?.suspendedReason ||
                    'Your account has been temporarily suspended by administrators. Please contact support.'}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ) : (
          !isIdVerified && (
            <>
              {verificationStatus === 'PENDING' ? (
                <Alert className="border-amber-500/50 bg-amber-500/5 text-amber-900 dark:text-amber-100">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="space-y-1">
                      <AlertTitle className="text-sm font-black uppercase tracking-widest">
                        Identity Verification Pending
                      </AlertTitle>
                      <AlertDescription className="text-xs font-medium opacity-90">
                        We are currently reviewing your identity documents.
                        Please verify your identity to upload and list sites on
                        our platform.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ) : verificationStatus === 'REJECTED' ? (
                <Alert
                  variant="destructive"
                  className="border-destructive/50 bg-destructive/5"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="space-y-1">
                      <AlertTitle className="text-sm font-black uppercase tracking-widest">
                        Verification Rejected
                      </AlertTitle>
                      <AlertDescription className="text-xs font-medium opacity-90">
                        Reason:{' '}
                        {user?.rejectionReason ||
                          'Your identity verification documents were not approved. Please review the comments and re-submit your details.'}
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
                <Alert className="border-amber-500/50 bg-amber-500/5 text-amber-900 dark:text-amber-100">
                  <UserCheck className="h-5 w-5 text-amber-600" />
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="space-y-1">
                      <AlertTitle className="text-sm font-black uppercase tracking-widest">
                        Identity Verification Required
                      </AlertTitle>
                      <AlertDescription className="text-xs font-medium opacity-90">
                        Please verify your identity to upload and list sites on
                        our platform.
                      </AlertDescription>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/dashboard/profile">
                        Verify ID
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Requests */}
        <Link
          href="/dashboard/landowner/bookings"
          className="block transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Pending Requests
              </CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-foreground">
                {isLoading ? (
                  <Skeleton className="h-9 w-12" />
                ) : (
                  metrics.pendingRequests
                )}
              </div>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
                Bookings awaiting manual approval
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Available Earnings */}
        <Link
          href="/dashboard/landowner/balance"
          className="block transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Available Earnings
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-foreground">
                {isLoading ? (
                  <Skeleton className="h-9 w-24" />
                ) : (
                  `£${Number(metrics.availableEarnings || 0).toFixed(2)}`
                )}
              </div>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
                Ready to withdraw to bank
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Active Sites */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Active Sites
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                metrics.activeSites
              )}
            </div>
            <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
              Sites verified and online
            </p>
          </CardContent>
        </Card>

        {/* Action Required */}
        <Card className="border-border/60 bg-muted/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Action Required
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                metrics.actionRequired
              )}
            </div>
            <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
              Unresolved incidents or credentials
            </p>
          </CardContent>
        </Card>
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
                <CardTitle className="text-sm font-black uppercase tracking-tight">
                  Needs Your Attention
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                        {item.type === 'booking_request' && (
                          <Calendar className="h-4 w-4 text-primary" />
                        )}
                        {item.type === 'emergency_confirmation' && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
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
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-60">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  All caught up!
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-60">
                  No items require your immediate attention right now.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: On Your Property Today */}
        <Card className="flex flex-col border-border/60 shadow-md">
          <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-black uppercase tracking-tight">
                  On Your Property Today
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Property Ledger
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
                          {item.operator}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{item.type}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {item.hasCertificate && (
                        <Badge
                          variant="outline"
                          className="hidden sm:inline-flex bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[10px] font-medium px-2 py-0.5"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Valid Certificate
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-border/60 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        asChild
                      >
                        <Link href={`/dashboard/landowner/bookings`}>
                          View Details
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-60">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No flights today
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-60">
                  No drone operations are scheduled for your properties today.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
