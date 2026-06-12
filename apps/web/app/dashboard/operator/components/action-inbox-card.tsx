'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card'
import { Button } from '@workspace/ui/components/button'
import { Inbox, CheckCircle2, Wallet, UserCheck, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import type { Booking } from '@/services/booking.types'

interface ActionInboxCardProps {
  isLoading: boolean
  bookings: Booking[]
  hasPaymentMethod: boolean
  isVerified: boolean
  verificationStatus: string
  loadingPaymentCheck: boolean
  unresolvedEmergency?: Booking
}

export function ActionInboxCard({
  isLoading,
  bookings,
  hasPaymentMethod,
  isVerified,
  verificationStatus,
  loadingPaymentCheck,
  unresolvedEmergency,
}: ActionInboxCardProps) {
  const actionItems = React.useMemo(() => {
    const items: any[] = []

    if (isLoading || loadingPaymentCheck) return items

    // 1. Payment configuration needed
    if (!hasPaymentMethod) {
      items.push({
        id: 'payment-config',
        type: 'billing',
        title: 'Billing Configuration Required',
        description: 'Please add a payment card to your profile to enable flight planning.',
        action: 'Configure Billing',
        link: '/dashboard/operator/billing',
        icon: Wallet,
        severity: 'warning',
      })
    }

    // 2. Profile Verification required / pending / rejected
    if (verificationStatus === 'BANNED') {
      items.push({
        id: 'banned',
        type: 'status',
        title: 'Account Banned',
        description: 'Your account is banned. Operations have been terminated.',
        action: null,
        icon: AlertTriangle,
        severity: 'error',
      })
    } else if (verificationStatus === 'SUSPENDED') {
      items.push({
        id: 'suspended',
        type: 'status',
        title: 'Account Suspended',
        description: 'Your account is suspended. Please contact support.',
        action: null,
        icon: AlertTriangle,
        severity: 'error',
      })
    } else if (!isVerified) {
      if (verificationStatus === 'PENDING') {
        items.push({
          id: 'verification-pending',
          type: 'verification',
          title: 'Verification Under Review',
          description: 'We are currently reviewing your pilot registration documents.',
          action: null,
          icon: Clock,
          severity: 'info',
        })
      } else if (verificationStatus === 'REJECTED') {
        items.push({
          id: 'verification-rejected',
          type: 'verification',
          title: 'Verification Rejected',
          description: 'Your pilot credentials were rejected. Update profile details.',
          action: 'Fix Profile',
          link: '/dashboard/profile',
          icon: AlertTriangle,
          severity: 'error',
        })
      } else {
        items.push({
          id: 'verification-required',
          type: 'verification',
          title: 'Identity Verification Required',
          description: 'Verify your pilot license and identity to unlock flight bookings.',
          action: 'Verify ID',
          link: '/dashboard/profile',
          icon: UserCheck,
          severity: 'warning',
        })
      }
    }

    // 3. Unresolved emergency booking
    if (unresolvedEmergency) {
      items.push({
        id: `emergency-resolve-${unresolvedEmergency.id}`,
        type: 'emergency',
        title: 'Emergency Flight Confirmation',
        description: `Confirm if emergency recovery was used at ${unresolvedEmergency.siteName || 'site'}.`,
        action: 'Confirm Usage',
        link: '/dashboard/operator/bookings',
        icon: AlertTriangle,
        severity: 'warning',
      })
    }

    // 4. Booking action items: Rejected bookings and pending approvals
    bookings.forEach((b) => {
      if (b.status === 'REJECTED') {
        items.push({
          id: `booking-rejected-${b.id}`,
          type: 'booking',
          title: `Flight Rejected: ${b.siteName}`,
          description: `Mission request (Ref: ${b.bookingReference}) was rejected by the owner.`,
          action: 'View Details',
          link: `/dashboard/operator/bookings?bookingId=${b.id}`,
          icon: AlertTriangle,
          severity: 'error',
        })
      } else if (b.status === 'PENDING') {
        items.push({
          id: `booking-pending-${b.id}`,
          type: 'booking',
          title: `Awaiting Approval: ${b.siteName}`,
          description: `Mission request (Ref: ${b.bookingReference}) is pending owner review.`,
          action: 'View Details',
          link: `/dashboard/operator/bookings?bookingId=${b.id}`,
          icon: Clock,
          severity: 'info',
        })
      }
    })

    return items.slice(0, 5) // cap at 5 actions
  }, [isLoading, loadingPaymentCheck, hasPaymentMethod, isVerified, verificationStatus, unresolvedEmergency, bookings])

  return (
    <Card className="flex flex-col border-border/60 shadow-md">
      <CardHeader className="border-b border-border/40 bg-muted/30 py-4 px-5">
        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
          Action Inbox
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {isLoading || loadingPaymentCheck ? (
          <div className="divide-y divide-border/40">
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 w-full">
                <div className="h-8 w-8 rounded-lg bg-muted/50 animate-pulse shrink-0" />
                <div className="space-y-2 w-full max-w-[200px]">
                  <div className="h-4 bg-muted/50 animate-pulse rounded" />
                  <div className="h-3 bg-muted/50 animate-pulse rounded" />
                </div>
              </div>
              <div className="h-8 w-20 bg-muted/50 animate-pulse rounded shrink-0" />
            </div>
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 w-full">
                <div className="h-8 w-8 rounded-lg bg-muted/50 animate-pulse shrink-0" />
                <div className="space-y-2 w-full max-w-[200px]">
                  <div className="h-4 bg-muted/50 animate-pulse rounded" />
                  <div className="h-3 bg-muted/50 animate-pulse rounded" />
                </div>
              </div>
              <div className="h-8 w-20 bg-muted/50 animate-pulse rounded shrink-0" />
            </div>
          </div>
        ) : actionItems.length > 0 ? (
          <div className="divide-y divide-border/40 max-h-[350px] overflow-y-auto custom-scrollbar">
            {actionItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/5 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background shadow-sm">
                      <Icon className={`h-4 w-4 ${
                        item.severity === 'error' ? 'text-red-500' :
                        item.severity === 'warning' ? 'text-amber-500' :
                        item.severity === 'success' ? 'text-emerald-500' :
                        'text-blue-500'
                      }`} />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-normal truncate">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                  {item.action && item.link && (
                    <Button size="sm" variant="outline" className="h-8 text-[11px] shrink-0 border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all" asChild>
                      <Link href={item.link}>
                        {item.action}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[240px]">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-semibold text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              No items require your immediate attention right now.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
