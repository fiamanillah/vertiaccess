'use client'

import * as React from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CircleSlash,
  TimerReset,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'
import { Textarea } from '@workspace/ui/components/textarea'
import { Badge } from '@workspace/ui/components/badge'
import { cn } from '@workspace/ui/lib/utils'
import { DetailedSite } from '../schema'

type SiteStatusChoice = 'ACTIVE' | 'DISABLE' | 'TEMPORARY_RESTRICTED'

interface SiteStatusModalProps {
  isOpen: boolean
  site: DetailedSite | null
  onClose: () => void
  onConfirm: (status: SiteStatusChoice, note?: string) => Promise<void> | void
}

const STATUS_OPTIONS: Array<{
  value: SiteStatusChoice
  title: string
  description: string
  icon: React.ElementType
  className: string
}> = [
  {
    value: 'ACTIVE',
    title: 'Activate site',
    description: 'Make the site bookable again for operators.',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  {
    value: 'DISABLE',
    title: 'Disable site',
    description: 'Remove the site from active booking availability.',
    icon: CircleSlash,
    className: 'border-slate-200 bg-slate-50 text-slate-800',
  },
  {
    value: 'TEMPORARY_RESTRICTED',
    title: 'Temporarily unavailable',
    description:
      'Pause bookings for maintenance, safety, or operational reasons.',
    icon: TimerReset,
    className: 'border-orange-200 bg-orange-50 text-orange-800',
  },
]

function getCurrentStatusLabel(status: DetailedSite['status']) {
  if (status === 'active') return 'ACTIVE'
  if (status === 'pending') return 'PENDING REVIEW'
  if (status === 'disabled') return 'DISABLED'
  if (status === 'temporary_unavailable') return 'TEMPORARILY UNAVAILABLE'
  return 'REJECTED'
}

export function SiteStatusModal({
  isOpen,
  site,
  onClose,
  onConfirm,
}: SiteStatusModalProps) {
  const [selectedStatus, setSelectedStatus] =
    React.useState<SiteStatusChoice | null>(() => {
      if (!site) {
        return null
      }

      return site.status === 'active' ? 'DISABLE' : 'ACTIVE'
    })
  const [note, setNote] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  if (!site) {
    return null
  }

  const handleConfirm = async () => {
    if (!selectedStatus || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm(selectedStatus, note.trim() || undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl border-border/60 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/15">
            <Clock3 className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">
            Update site status
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose the operational state for{' '}
            <span className="font-semibold text-foreground">{site.name}</span>.
            Active sites remain bookable, while disabled and temporary states
            remove the site from normal booking flow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] uppercase tracking-widest font-bold"
            >
              Current: {getCurrentStatusLabel(site.status)}
            </Badge>
            {site.status !== 'active' && (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] uppercase tracking-widest font-bold border-none">
                Status changes unlocked after approval
              </Badge>
            )}
          </div>

          <div className="grid gap-3">
            {STATUS_OPTIONS.map((option) => {
              const Icon = option.icon
              const isSelected = selectedStatus === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedStatus(option.value)}
                  className={cn(
                    'relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all hover:shadow-sm',
                    option.className,
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'opacity-90',
                  )}
                >
                  <div className="mt-0.5 h-10 w-10 rounded-xl bg-background/80 border border-current/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold tracking-tight">
                        {option.title}
                      </h4>
                      {isSelected && (
                        <Badge className="h-5 border-none bg-background/80 text-foreground text-[9px] uppercase tracking-widest font-bold">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Optional note
            </div>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add context for this status change, especially if bookings or maintenance are involved."
              className="min-h-32 rounded-2xl border-border/60 bg-muted/30 focus-visible:ring-primary"
            />
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStatus || isSubmitting}
            className="font-bold shadow-md shadow-primary/20"
          >
            {isSubmitting ? 'Updating...' : 'Confirm status change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
