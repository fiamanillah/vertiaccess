'use client'

import * as React from 'react'
import { Ticket } from '@/app/dashboard/components/incident-report/types'
import { CaseSidebar } from './case-sidebar'
import { CaseThread } from './case-thread'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { MessageVisibility } from '@/app/dashboard/components/incident-report/types'

interface CaseDetailViewProps {
  ticket: Ticket
  backUrl: string
  replyVisibility: MessageVisibility
  onTicketUpdate: (ticket: Ticket) => void
}

export function CaseDetailView({ ticket, backUrl, replyVisibility, onTicketUpdate }: CaseDetailViewProps) {
  const getStatusVariant = (status: string) => {
    if (status === 'action_required') return 'destructive'
    if (status === 'under_review') return 'secondary'
    return 'outline'
  }

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
            >
              <Link href={backUrl}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase mb-0.5">
                <span>{ticket.reference}</span>
              </div>
              <h1 className="text-lg font-bold truncate">
                {ticket.category.replace(/_/g, ' ')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge variant={getStatusVariant(ticket.status)} className="gap-2">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs capitalize">
                {ticket.status.replace(/_/g, ' ')}
              </span>
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="order-2 lg:order-1 min-w-0">
            <CaseThread
              ticket={ticket}
              incidentId={ticket.id}
              replyVisibility={replyVisibility}
              onTicketUpdate={onTicketUpdate}
            />
          </div>
          <div className="order-1 lg:order-2 lg:sticky lg:top-20">
            <CaseSidebar ticket={ticket} />
          </div>
        </div>
      </main>
    </div>
  )
}
