'use client';

import '@workspace/ui/styles/globals.css';
import * as React from 'react';
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { TooltipProvider } from '@workspace/ui/components/tooltip';
import { AppSidebar } from './components/app-sidebar';
import { DashboardHeader } from './components/dashboard-header';
import { ScrollArea } from '@workspace/ui/components/scroll-area';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    return (
        <TooltipProvider>
            <SidebarProvider className="h-svh">
                <AppSidebar />
                <SidebarInset className="overflow-hidden">
                    <DashboardHeader />
                    <ScrollArea className="flex-1 min-h-0">
                        <main className="p-4 md:p-6">{children}</main>
                    </ScrollArea>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
