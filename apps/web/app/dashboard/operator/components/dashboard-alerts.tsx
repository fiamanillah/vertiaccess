'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert'
import { Button } from '@workspace/ui/components/button'
import { ArrowRight, UserCheck, AlertTriangle, Clock } from 'lucide-react'

interface DashboardAlertsProps {
  loadingPaymentCheck: boolean
  hasPaymentMethod: boolean
  verificationStatus: string
  isVerified: boolean
  user: any
}

export function DashboardAlerts({
  loadingPaymentCheck,
  hasPaymentMethod,
  verificationStatus,
  isVerified,
  user,
}: DashboardAlertsProps) {
  return (
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
  )
}
