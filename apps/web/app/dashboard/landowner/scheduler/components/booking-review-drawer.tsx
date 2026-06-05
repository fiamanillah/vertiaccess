'use client'

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@workspace/ui/components/sheet'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'
import {
  User,
  Building2,
  Plane,
  Target,
  Calendar,
  Clock,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  FileText,
  ShieldAlert,
  Gavel,
  Phone,
} from 'lucide-react'
import { Booking } from '../types'
import { cn } from '@workspace/ui/lib/utils'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface BookingReviewDrawerProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function BookingReviewDrawer({
  booking,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: BookingReviewDrawerProps) {
  const router = useRouter()
  const [prefilledCategory, setPrefilledCategory] = React.useState<
    string | undefined
  >(undefined)

  if (!booking) return null

  const startTime = new Date(booking.startTime)
  const endTime = new Date(booking.endTime)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="sr-only">Review operation request</SheetTitle>
          <SheetDescription className="sr-only">
            Review the operation details and approve or reject the request.
          </SheetDescription>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between mb-4">
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 border-primary/20 text-primary bg-primary/5"
              >
                {booking.bookingReference ?? booking.vaId}
              </Badge>
              <Badge
                className={cn(
                  'text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2',
                  booking.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-700'
                    : booking.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700',
                )}
              >
                {booking.status}
              </Badge>
            </div>
            <div className="flex flex-col">
              <div className="text-3xl font-black tracking-tighter text-foreground uppercase">
                Infrastructure Access Request
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Operation Details */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Target className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">
                  Operation Details
                </h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50 divide-y divide-border/30 space-y-3 *:pt-3 first:*:pt-0">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Request ID</span>
                  <span className="font-mono font-bold text-foreground bg-muted/80 px-2 py-0.5 rounded border border-border/40 text-xs">
                    {booking.bookingReference ?? booking.vaId}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Asset_Name</span>
                  <span className="font-bold text-foreground">{booking.siteName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Asset_ID</span>
                  <span className="font-bold text-foreground">{booking.siteVaId || booking.siteName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Asset Type</span>
                  <span className="font-bold text-foreground">
                    {booking.siteCategory ? booking.siteCategory.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Asset Status</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {booking.siteStatus ? booking.siteStatus.charAt(0).toUpperCase() + booking.siteStatus.slice(1).toLowerCase() : 'Active'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Capability Requested</span>
                  <span className="font-bold text-foreground">
                    {booking.useCategory === 'planned_toal' ? 'TOAL' : booking.useCategory === 'emergency_recovery' ? 'Emergency Recovery' : booking.useCategory}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Start Date and Time</span>
                  <span className="font-medium text-foreground">{format(startTime, 'dd-MM-yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">End Date and Time</span>
                  <span className="font-medium text-foreground">{format(endTime, 'dd-MM-yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Operational Intent</span>
                  <span className="font-medium text-foreground italic">"{booking.missionIntent || 'N/A'}"</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Drone Model</span>
                  <span className="font-bold text-foreground">{booking.droneModel || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Manufacture</span>
                  <span className="font-bold text-foreground">{booking.manufacturer || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Airframe</span>
                  <span className="font-bold text-foreground">{booking.airframe || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Maximum Take-off Weight (MTOW)</span>
                  <span className="font-bold text-foreground">{booking.mtow || 'N/A'}</span>
                </div>
              </div>
            </section>

            {/* Operator Identity */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <User className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">
                  Operator Identity
                </h3>
              </div>
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {booking.operatorName?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      {booking.operatorName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {booking.operatorEmail}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" /> Organisation
                    </div>
                    <div className="text-sm font-medium">
                      {booking.operatorOrganisation || 'Independent'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> Phone
                    </div>
                    <div className="text-sm font-medium truncate">
                      {booking.operatorPhone || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3" /> CAA Flyer ID
                    </div>
                    <div className="text-sm font-mono">
                      {booking.operatorFlyerId || 'PENDING'}
                    </div>
                  </div>
                </div>
              </div>
            </section>



            {/* Financial Snapshot */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <CreditCard className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">
                  Financial Summary
                </h3>
              </div>
              <div
                className={cn(
                  'rounded-xl p-5 flex items-center justify-between border shadow-sm',
                  booking.useCategory === 'emergency_recovery'
                    ? 'bg-amber-50/50 border-amber-100'
                    : 'bg-emerald-50/30 border-emerald-100',
                )}
              >
                <div className="space-y-0.5">
                  <div
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      booking.useCategory === 'emergency_recovery'
                        ? 'text-amber-700'
                        : 'text-emerald-700',
                    )}
                  >
                    {booking.useCategory === 'emergency_recovery'
                      ? 'Emergency Standby Fee'
                      : 'Access Fee'}
                  </div>
                  <div
                    className={cn(
                      'text-3xl font-black tracking-tight',
                      booking.useCategory === 'emergency_recovery'
                        ? 'text-amber-900'
                        : 'text-emerald-900',
                    )}
                  >
                    £{booking.toalCost?.toFixed(2)}
                  </div>
                  {booking.useCategory === 'emergency_recovery' && (
                    <p className="text-[9px] font-bold text-amber-600 mt-1 italic uppercase tracking-tighter">
                      Only paid if site is used
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Badge
                    className={cn(
                      'border-none font-bold text-[10px]',
                      booking.useCategory === 'emergency_recovery'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700',
                    )}
                  >
                    {booking.useCategory === 'emergency_recovery'
                      ? 'POTENTIAL'
                      : 'PAID (ESCROW)'}
                  </Badge>
                </div>
              </div>
            </section>
          </div>
        </div>

        <SheetFooter className="p-6 border-t bg-muted/10 flex flex-col gap-3">
          {booking.status === 'PENDING' ? (
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-black text-[11px] uppercase tracking-widest h-12 shadow-sm"
                onClick={() => onReject(booking.id)}
              >
                Decline
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-widest h-12 shadow-lg shadow-emerald-600/20"
                onClick={() => onApprove(booking.id)}
              >
                Approve Access
              </Button>
            </div>
          ) : booking.useCategory === 'emergency_recovery' &&
            booking.paymentStatus === 'refunded' ? (
            <Button
              variant="outline"
              className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 font-black text-[11px] uppercase tracking-widest h-12 gap-2"
              onClick={() => {
                router.push(`/dashboard/landowner/incident-report/new?bookingId=${booking.id}&siteId=${booking.siteId}&category=landowner_dispute`)
              }}
            >
              <Gavel className="h-4 w-4" />
              Dispute Non-Usage
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[9px] font-black uppercase tracking-widest h-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 gap-2 border border-transparent hover:border-red-100"
            onClick={() => {
              router.push(`/dashboard/landowner/incident-report/new?bookingId=${booking.id}&siteId=${booking.siteId}`)
            }}
          >
            <ShieldAlert className="h-3 w-3" />
            Report an Issue
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
