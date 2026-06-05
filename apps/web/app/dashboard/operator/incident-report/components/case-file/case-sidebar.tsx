'use client'

import * as React from 'react'
import { Ticket } from '@/app/dashboard/components/incident-report/types'
import { Badge } from '@workspace/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Separator } from '@workspace/ui/components/separator'
import { Skeleton } from '@workspace/ui/components/skeleton'
import {
  Info,
  ExternalLink,
  User,
  Building2,
  Plane,
  ScrollText,
  Ban,
  Lock,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'
import { bookingService } from '@/services/booking.service'
import { format } from 'date-fns'

interface CaseSidebarProps {
  ticket: Ticket
}

export function CaseSidebar({ ticket }: CaseSidebarProps) {
  const [bookingDetails, setBookingDetails] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOperator, setIsOperator] = React.useState(true)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOperator(window.location.pathname.includes('/operator/'))
    }
  }, [])

  React.useEffect(() => {
    if (ticket.bookingId) {
      setIsLoading(true)
      bookingService.getBooking(ticket.bookingId)
        .then((data) => {
          if (data) {
            setBookingDetails(data)
          }
        })
        .catch((err) => {
          console.error('Error loading booking details in sidebar:', err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [ticket.bookingId])

  const decisionIcon =
    ticket.decision?.action === 'ban' ? (
      <Ban className="h-4 w-4 text-destructive" />
    ) : ticket.decision?.action === 'temporary_suspend' ? (
      <Lock className="h-4 w-4 text-warning" />
    ) : ticket.decision?.action === 'warning' ? (
      <ShieldAlert className="h-4 w-4 text-warning" />
    ) : (
      <CheckCircle2 className="h-4 w-4 text-primary" />
    )

  return (
    <aside className="space-y-4">
      <Card className="border shadow-none bg-background/50 backdrop-blur-xl overflow-hidden">
        {/* Accent bar at the top */}
        <div
          className={cn(
            'h-1.5 w-full',
            ticket.status === 'action_required'
              ? 'bg-destructive'
              : ticket.status === 'under_review'
              ? 'bg-warning'
              : 'bg-primary'
          )}
        />
        
        <CardHeader className="pb-4 pt-4 px-4">
          <div className="flex mb-2">
            <Badge
              variant={
                ticket.status === 'action_required'
                  ? 'destructive'
                  : ticket.status === 'under_review'
                  ? 'secondary'
                  : 'outline'
              }
              className="text-[9px] font-black uppercase tracking-widest h-5 px-2"
            >
              {ticket.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <CardTitle className="text-xl font-black tracking-tighter uppercase">
            {ticket.reference}
          </CardTitle>
          <div className="text-xs text-muted-foreground mt-1 font-medium">
            Created at: {format(new Date(ticket.createdAt), 'dd-MM-yyyy HH:mm')}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 p-4 pt-0">
          <Separator className="bg-border/40" />

          {/* Overview & Parties */}
          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Overview & Parties
            </div>
            
            {ticket.decision && (
              <div className="bg-muted/30 p-3 rounded-xl border border-border/40 space-y-1">
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                  {decisionIcon}
                  <span>Decision</span>
                </div>
                <div className="text-xs font-bold capitalize text-foreground">
                  {ticket.decision.action.replace(/_/g, ' ')}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {ticket.decision.reason}
                </p>
              </div>
            )}

            <div className="grid gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Plane className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Operator</div>
                  <div className="text-xs font-bold text-foreground truncate">{ticket.operatorName || 'Unknown'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Landowner</div>
                  <div className="text-xs font-bold text-foreground truncate">{ticket.landownerName || 'Unknown'}</div>
                </div>
              </div>
            </div>
          </div>

          {ticket.bookingId && (
            <>
              <Separator className="bg-border/40" />

              {/* Operation Details */}
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Operation Details
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : bookingDetails ? (
                  <div className="space-y-2.5 text-xs bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Operation ID</span>
                      <span className="font-mono font-semibold bg-muted/50 px-2 py-0.5 rounded text-[10px] text-foreground">
                        {bookingDetails.bookingReference}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Asset Name</span>
                      <span className="font-semibold text-foreground text-right">{bookingDetails.siteName || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Asset ID</span>
                      <span className="font-mono text-foreground text-right">{bookingDetails.siteVaId || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Asset Type</span>
                      <span className="font-semibold capitalize text-foreground text-right">
                        {bookingDetails.siteCategory?.replace(/_/g, ' ') || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Capability Requested</span>
                      <span className="font-semibold text-foreground text-right">
                        {bookingDetails.useCategory === 'planned_toal'
                          ? 'TOAL'
                          : bookingDetails.useCategory === 'emergency_recovery'
                          ? 'Emergency Recovery'
                          : bookingDetails.useCategory || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Start Date & Time</span>
                      <span className="font-semibold text-foreground text-right">
                        {format(new Date(bookingDetails.startTime), 'dd-MM-yyyy HH:mm')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">End Date & Time</span>
                      <span className="font-semibold text-foreground text-right">
                        {format(new Date(bookingDetails.endTime), 'dd-MM-yyyy HH:mm')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Drone Model</span>
                      <span className="font-semibold text-foreground text-right">{bookingDetails.droneModel || 'N/A'}</span>
                    </div>

                    <div className="py-1.5 flex flex-col">
                      <span className="font-medium text-muted-foreground uppercase tracking-wider text-[10px] block mb-1">Operational Intent</span>
                      <span className="font-normal text-foreground italic leading-relaxed block">
                        "{bookingDetails.missionIntent || 'N/A'}"
                      </span>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={
                          isOperator
                            ? `/dashboard/operator/bookings/${ticket.bookingId}`
                            : `/dashboard/landowner/scheduler/${ticket.bookingId}/review`
                        }
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                      >
                        View Full Request <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">Operation details unavailable.</div>
                )}
              </div>
            </>
          )}

          <Separator className="bg-border/40" />

          <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border/40 p-3 text-muted-foreground">
            <ScrollText className="h-4 w-4 shrink-0" />
            <p className="text-[10px] font-bold leading-tight">
              This investigation is mediated by the VertiAccess Safety Team. All decisions are final.
            </p>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

