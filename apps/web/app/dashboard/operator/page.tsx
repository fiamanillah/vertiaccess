'use client'

import * as React from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
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
  Search,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'
import { useAuthStore } from '@/store/use-auth-store'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { bookingService } from '@/services/booking.service'
import { paymentService } from '@/services/payments/payment.service'
import { cn } from '@workspace/ui/lib/utils'
import type { Booking } from '@/services/booking.types'

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

  const [allBookings, setAllBookings] = React.useState<Booking[]>([])
  const [selectedBookingId, setSelectedBookingId] = React.useState<
    string | null
  >(null)
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [searchQuery, setSearchQuery] = React.useState<string>('')

  const [needsAttention, setNeedsAttention] = React.useState<any[]>([])
  const [todaySchedule, setTodaySchedule] = React.useState<any[]>([])

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
        {!loadingPaymentCheck && !hasPaymentMethod && (
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600 animate-pulse shrink-0" />
            <div className="flex w-full items-center justify-between gap-4">
              <div className="space-y-1">
                <AlertTitle className="text-sm font-semibold">
                  Payment Profile Configuration Required
                </AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-90 text-amber-700 dark:text-amber-300">
                  Please add a payment card to your profile to enable flight
                  planning and booking permissions.
                </AlertDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="shrink-0 font-semibold border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/40"
              >
                <Link href="/dashboard/operator/billing">
                  Configure Billing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Alert>
        )}

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

      {/* Operations Map & List Sidepanel (Single Card) */}
      <Card className="flex flex-col border-border/60 shadow-md overflow-hidden h-[600px] lg:h-[650px] p-0!">
        <CardHeader className="border-b border-border/40 bg-muted/30  shrink-0 p-2!">
          <div className="flex items-center ">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-background shadow-sm">
              <Globe className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-md font-bold tracking-tight text-foreground">
              Operations Network Map
            </CardTitle>
          </div>
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
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search site or ref..."
                  className="w-full text-xs bg-background border border-border/60 rounded-md pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
                              {booking.siteName}
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
                            'text-[9px] uppercase tracking-wider font-bold border-none px-1.5 py-0.5',
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
                          {booking.status}
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
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
                  <Clock className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    No operations found
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
        {/* Left Column: Mission Requests */}
        <Card className="flex flex-col border-border/60 shadow-md">
          <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                <Inbox className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Mission Requests
                </CardTitle>
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
            ) : allBookings.length > 0 ? (
              <div className="divide-y divide-border/40 max-h-[350px] overflow-y-auto custom-scrollbar">
                {allBookings.slice(0, 10).map((booking) => {
                  const start = new Date(booking.startTime)
                  const end = new Date(booking.endTime)
                  const dateStr = format(start, 'dd MMM yyyy')
                  const timeStr = `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
                  const statusLabel = toTitleCase(booking.status)

                  return (
                    <div
                      key={booking.id}
                      className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/5"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background shadow-sm">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-none truncate">
                            {toTitleCase(booking.siteName || 'Unknown Site')}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span>{dateStr}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <span>{timeStr}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          className={cn(
                            'text-[9px] uppercase tracking-wider font-bold border-none px-1.5 py-0.5',
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
                          {statusLabel}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-border/60 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                          asChild
                        >
                          <Link
                            href={`/dashboard/operator/bookings/${booking.id}`}
                          >
                            View Details
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[240px]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                  <Inbox className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No Mission Requests
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                  You have not submitted any mission requests yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Today's Operations */}
        <Card className="flex flex-col border-border/60 shadow-md">
          <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Today's Operations
                </CardTitle>
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
            ) : (
              (() => {
                const todayBookings = allBookings.filter((b) => {
                  const start = new Date(b.startTime)
                  const now = new Date()
                  return (
                    start.getFullYear() === now.getFullYear() &&
                    start.getMonth() === now.getMonth() &&
                    start.getDate() === now.getDate()
                  )
                })

                return todayBookings.length > 0 ? (
                  <div className="divide-y divide-border/40 max-h-[350px] overflow-y-auto custom-scrollbar">
                    {todayBookings.map((booking) => {
                      const start = new Date(booking.startTime)
                      const end = new Date(booking.endTime)
                      const timeStr = `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
                      const statusLabel = toTitleCase(booking.status)

                      return (
                        <div
                          key={booking.id}
                          className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/5"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background shadow-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground leading-none truncate">
                                {toTitleCase(
                                  booking.siteName || 'Unknown Site',
                                )}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                <span>
                                  {booking.useCategory === 'planned_toal'
                                    ? 'Planned TOAL'
                                    : 'Emergency Recovery'}
                                </span>
                                <span className="text-muted-foreground/40">
                                  •
                                </span>
                                <span>{timeStr}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge
                              className={cn(
                                'text-[9px] uppercase tracking-wider font-bold border-none px-1.5 py-0.5',
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
                              {statusLabel}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-border/60 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                              asChild
                            >
                              <Link
                                href={`/dashboard/operator/bookings/${booking.id}`}
                              >
                                View Details
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[240px]">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                      <Calendar className="h-5 w-5 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      No Operations Today
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                      No drone operations are scheduled for today.
                    </p>
                  </div>
                )
              })()
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
