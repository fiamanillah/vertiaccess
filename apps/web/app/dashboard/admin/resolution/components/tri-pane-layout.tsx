'use client'

import * as React from 'react'
import { Ticket } from '../../../../../components/resolution/types'
import { AdminThreadViewer } from './admin-thread-viewer'
import { ContextHub } from './context-hub'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { ChevronLeft, Scale, Shield } from 'lucide-react'
import Link from 'next/link'

interface TriPaneLayoutProps {
  activeTicket: Ticket
}

export function TriPaneLayout({ activeTicket }: TriPaneLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/dashboard/admin/resolution">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-md">
              <Scale className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Admin Panel
              </span>
              <span className="text-sm font-bold leading-none">
                Resolution Center
              </span>
            </div>
          </div>
        </div>

        <Badge variant="secondary" className="gap-2 flex items-center">
          <Shield className="h-3 w-3" />
          <span className="text-xs">Audit Mode</span>
        </Badge>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Thread Viewer */}
          <div className="min-w-0 order-2 lg:order-1">
            <AdminThreadViewer ticket={activeTicket} />
          </div>

          {/* Context Hub Sidebar */}
          <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
            <ContextHub ticket={activeTicket} />
          </aside>
        </div>
      </main>
    </div>
  )
}
