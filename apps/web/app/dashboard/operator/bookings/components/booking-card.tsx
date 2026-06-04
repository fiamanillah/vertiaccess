'use client'

import * as React from 'react'
import { Card, CardContent } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { FileText, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react'
import { Booking } from '../types'
import { cn } from '@workspace/ui/lib/utils'
import { format } from 'date-fns'

interface BookingCardProps {
  booking: Booking
  onViewDetails: (booking: Booking) => void
  onCancel?: (booking: Booking) => void
}

export function BookingCard({
  booking,
  onViewDetails,
  onCancel,
}: BookingCardProps) {
  const startTime = new Date(booking.startTime)
  const endTime = new Date(booking.endTime)

  const statusConfig = {
    PENDING: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
    APPROVED: { color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
    REJECTED: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
    CANCELLED: { color: 'bg-muted text-muted-foreground', label: 'Cancelled' },
    EXPIRED: { color: 'bg-muted text-muted-foreground', label: 'Expired' },
  }

  const config = statusConfig[booking.status] || statusConfig.PENDING

  return (
    <Card className="group hover:shadow-md transition-all duration-300 border-border/60 overflow-hidden bg-background/50 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="p-5 sm:p-6 space-y-4">
          {/* Header: Date & Status */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-black tracking-tighter text-foreground uppercase">
                {format(startTime, 'dd MMM yyyy')}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Clock className="h-3 w-3" />
                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
              </div>
            </div>
            <Badge
              className={cn(
                'text-[9px] font-black uppercase tracking-widest border-none px-2 h-5',
                config.color,
              )}
            >
              {config.label}
            </Badge>
          </div>

          {/* Body: Site & Type */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="bg-primary/5 p-1.5 rounded-md mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-bold truncate tracking-tight">
                  {booking.siteName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-medium">
                  {booking.bookingReference}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-[9px] font-black uppercase tracking-widest h-5 px-2 border-none',
                  booking.useCategory === 'planned_toal'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'bg-amber-50 text-amber-700',
                )}
              >
                {booking.useCategory.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {booking.status === 'PENDING' ? (
              <Button
                variant="outline"
                className="flex-1 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 font-black text-[10px] uppercase tracking-widest h-9"
                onClick={() => onCancel?.(booking)}
              >
                Cancel Request
              </Button>
            ) : null}

            <Button
              variant="ghost"
              className="text-[10px] font-black uppercase tracking-widest h-9 hover:bg-primary/5 text-muted-foreground group-hover:text-primary transition-colors"
              onClick={() => onViewDetails(booking)}
            >
              View Details
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
