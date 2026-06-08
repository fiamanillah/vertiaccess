import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'
import type { Booking } from '../../../types'

interface ReviewHeaderProps {
  booking: Booking
}

export function ReviewHeader({ booking }: ReviewHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => router.push('/dashboard/assetmanager/scheduler')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-bold">Back</span>
        </Button>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
            <span className="font-mono text-foreground">
              {(booking.bookingReference ?? booking.vaId ?? '').toUpperCase()}
            </span>
          </div>
          <h1 className="text-sm font-bold tracking-tight text-foreground truncate max-w-[300px]">
            Review Request: {booking.siteName}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant="outline"
          className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 border-primary/20 text-primary bg-primary/5 h-5 hidden sm:inline-flex"
        >
          {(booking.bookingReference ?? booking.vaId ?? '').toUpperCase()}
        </Badge>
        <Badge
          className={`text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2 ${
            booking.status === 'PENDING'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
              : booking.status === 'APPROVED'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          {booking.status}
        </Badge>
      </div>
    </div>
  )
}
