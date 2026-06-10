'use client'

import '@workspace/ui/styles/globals.css'
import * as React from 'react'
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar'
import { TooltipProvider } from '@workspace/ui/components/tooltip'
import { AppSidebar } from './components/app-sidebar'
import { DashboardHeader } from './components/dashboard-header'
import { useAuthStore } from '@/store/use-auth-store'
import { WalledGarden } from './components/walled-garden'
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuthStore();

  if (user) {
    const isStateA = user.paymentLocked || user.verificationStatus === 'PAYMENT_LOCKED';
    const isStateB = user.verificationStatus === 'SUSPENDED' && !isStateA;
    const isStateC = user.verificationStatus === 'BANNED';
    
    if (isStateA || isStateB || isStateC) {
      return <WalledGarden user={user} />;
    }
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="relative z-0">
          <div className="rounded-lg h-[calc(100vh-20px)] overflow-y-auto custom-scrollbar">
            <DashboardHeader />
            {user?.hasFailedBookingPayment && (
              <div className="px-6 pt-4">
                <Alert
                  variant="destructive"
                  className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200 shadow-sm"
                >
                  <AlertTriangle className="h-5 w-5 animate-pulse shrink-0" />
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="space-y-1">
                      <AlertTitle className="text-sm font-semibold">
                        Outstanding Balance Overdue
                      </AlertTitle>
                      <AlertDescription className="text-xs font-medium opacity-90 text-red-700 dark:text-red-300">
                        Card transaction failed. Please update your payment method to settle outstanding balance before your next request.
                      </AlertDescription>
                    </div>
                    <Button size="sm" variant="destructive" asChild className="shrink-0 font-semibold">
                      <Link href="/dashboard/operator/billing">
                        Update Payment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Alert>
              </div>
            )}
            <main>{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
