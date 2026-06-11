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
  ArrowRight,
  Wallet,
  UserCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { useAuthStore } from '@/store/use-auth-store'
import { paymentService } from '@/services/payments/payment.service'

export function AlertBanners() {
  const user = useAuthStore((state) => state.user)
  const isIdVerified =
    user?.verified ||
    user?.verificationStatus === 'APPROVED' ||
    user?.verificationStatus === 'VERIFIED' ||
    false
  const verificationStatus = user?.verificationStatus || ''
  const [isStripeConnected, setIsStripeConnected] = React.useState(true)

  React.useEffect(() => {
    let mounted = true

    async function checkStripeConnection() {
      try {
        const balanceRes = await paymentService.getAssetManagerBalance()
        if (mounted && balanceRes) {
          setIsStripeConnected(Boolean(balanceRes.stripeConnected))
        }
      } catch (error) {
        console.error('Failed to load Stripe balance status', error)
        if (mounted) {
          setIsStripeConnected(false)
        }
      }
    }

    void checkStripeConnection()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {!isStripeConnected && (
        <Alert
          variant="destructive"
          className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200"
        >
          <Wallet className="h-5 w-5" />
          <div className="flex w-full items-center justify-between gap-4">
            <div className="space-y-1">
              <AlertTitle className="text-sm font-semibold">
                Action Required: Payouts Disabled
              </AlertTitle>
              <AlertDescription className="text-xs font-medium opacity-90 text-red-700 dark:text-red-300">
                Connect your bank account via Stripe to receive payouts for
                your approved drone operations.
              </AlertDescription>
            </div>
            <Button size="sm" variant="destructive" asChild>
              <Link href="/dashboard/assetmanager/balance">
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
        !isIdVerified && (
          <>
            {verificationStatus === 'PENDING' ? (
              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200">
                <Clock className="h-5 w-5 text-amber-600" />
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="space-y-1">
                    <AlertTitle className="text-sm font-semibold">
                      Identity Verification Pending
                    </AlertTitle>
                    <AlertDescription className="text-xs font-medium opacity-90 text-amber-700 dark:text-amber-300">
                      We are currently reviewing your identity documents.
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
              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200">
                <UserCheck className="h-5 w-5 text-amber-600" />
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="space-y-1">
                    <AlertTitle className="text-sm font-semibold">
                      Identity Verification Required
                    </AlertTitle>
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
  )
}
