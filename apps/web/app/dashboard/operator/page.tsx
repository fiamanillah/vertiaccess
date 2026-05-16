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
} from 'lucide-react'
import { useAuthStore } from '@/store/use-auth-store'

export default function Page() {
  const user = useAuthStore((state) => state.user)
  const isVerified = user?.verified || false
  const verificationStatus = user?.verificationStatus || ''

  return (
    <div className="flex flex-col gap-8 container mx-auto p-4">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operator Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back, {user?.firstName || 'Operator'}. Manage your drone flight operations.
        </p>
      </div>

      {/* Global Alert Banners based on Verification Status */}
      <div className="flex flex-col gap-3">
        {verificationStatus === 'BANNED' ? (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            <div className="flex w-full items-center justify-between gap-4">
              <div className="space-y-1">
                <AlertTitle className="text-sm font-black uppercase tracking-widest">
                  Account Permanently Banned
                </AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-90">
                  This account has been permanently banned from the VertiAccess network due to severe policy or terms violations. Standard platform operations have been terminated.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ) : verificationStatus === 'SUSPENDED' ? (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5" />
            <div className="flex w-full items-center justify-between gap-4">
              <div className="space-y-1">
                <AlertTitle className="text-sm font-black uppercase tracking-widest">
                  Account Temporarily Suspended
                </AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-90">
                  Reason: {user?.suspendedReason || 'Your account has been temporarily suspended by administrators. Please contact support.'}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ) : !isVerified && (
          <>
            {verificationStatus === 'PENDING' ? (
              <Alert className="border-amber-500/50 bg-amber-500/5 text-amber-900 dark:text-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="space-y-1">
                    <AlertTitle className="text-sm font-black uppercase tracking-widest">
                      Verification Under Review
                    </AlertTitle>
                    <AlertDescription className="text-xs font-medium opacity-90">
                      We are currently reviewing your CAA Operator ID and license documentation. You will receive an email once approved.
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ) : verificationStatus === 'REJECTED' ? (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                <AlertTriangle className="h-5 w-5" />
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="space-y-1">
                    <AlertTitle className="text-sm font-black uppercase tracking-widest">
                      Verification Rejected
                    </AlertTitle>
                    <AlertDescription className="text-xs font-medium opacity-90">
                      Reason: {user?.rejectionReason || 'Your pilot registration credentials were not approved. Please review the comments and re-submit your details.'}
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
                      Verification Required
                    </AlertTitle>
                    <AlertDescription className="text-xs font-medium opacity-90">
                      Please verify your pilot license and identity to unlock flight booking options across our network.
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
        )}
      </div>

      {/* At-a-Glance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Scheduled Flights */}
        <Link
          href="/dashboard/operator/bookings"
          className="block transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Scheduled Flights
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-foreground">
                3
              </div>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
                Upcoming flight operations
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Pending Approvals */}
        <Link
          href="/dashboard/operator/bookings"
          className="block transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Pending Approvals
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-foreground">
                1
              </div>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
                Awaiting landowner confirmation
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Approved Consents */}
        <Link
          href="/dashboard/operator/consent"
          className="block transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Approved Consents
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-foreground">
                12
              </div>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
                Active site access consents
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Action Required */}
        <Link
          href="/dashboard/operator/incident-report"
          className="block transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Card className="h-full border-border/60 shadow-sm bg-muted/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Action Required
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-foreground">
                0
              </div>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
                Disputes or expired credentials
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
