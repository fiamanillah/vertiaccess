'use client';

import '@workspace/ui/styles/globals.css';
import * as React from 'react';
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { TooltipProvider } from '@workspace/ui/components/tooltip';
import { AppSidebar } from './components/app-sidebar';
import { DashboardHeader } from './components/dashboard-header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <DashboardHeader />
                    <main className="flex flex-1 flex-col gap-4 p-4 ">{children}</main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
