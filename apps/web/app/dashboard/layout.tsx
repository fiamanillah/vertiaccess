'use client'

import '@workspace/ui/styles/globals.css'
import * as React from 'react'
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar'
import { TooltipProvider } from '@workspace/ui/components/tooltip'
import { AppSidebar } from './components/app-sidebar'
import { DashboardHeader } from './components/dashboard-header'
import { useAuthStore } from '@/store/use-auth-store'
import { WalledGarden } from './components/walled-garden'

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
            <main>{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
