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
            <SidebarProvider >
                <AppSidebar />
                <SidebarInset className='relative z-0' >
                    <div className='rounded-lg h-[calc(100vh-20px)] overflow-y-auto custom-scrollbar'>
                        <DashboardHeader />
                        <main className="p-4 md:p-6">{children}</main>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
