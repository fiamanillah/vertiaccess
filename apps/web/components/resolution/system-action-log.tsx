'use client'

import * as React from 'react'
import { ActionLog } from '../../app/dashboard/components/resolution/types'
import { format } from 'date-fns'
import {
  Settings,
  ShieldAlert,
  CreditCard,
  FileSearch,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

interface SystemActionLogProps {
  log: ActionLog
}

export function SystemActionLog({ log }: SystemActionLogProps) {
  const getIcon = () => {
    if (log.content.includes('Refund') || log.content.includes('payment'))
      return <CreditCard className="h-3 w-3" />
    if (log.content.includes('requested') || log.content.includes('logs'))
      return <FileSearch className="h-3 w-3" />
    if (log.content.includes('sanction') || log.content.includes('suspended'))
      return <ShieldAlert className="h-3 w-3" />
    return <Settings className="h-3 w-3" />
  }

  return (
    <div className="flex items-center gap-4 py-4 group">
      <div className="flex-1 h-px bg-border/40 group-hover:bg-border/60 transition-colors" />
      <div className="flex items-center gap-3 px-6 py-2 rounded-full border bg-muted/30 backdrop-blur-sm shadow-sm group-hover:bg-background group-hover:border-border transition-all duration-300">
        <div className="bg-muted-foreground/10 p-1 rounded-full">
          {getIcon()}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
            {log.content}
          </span>
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter tabular-nums px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/40">
            {format(new Date(log.timestamp), 'HH:mm')}
          </span>
        </div>
      </div>
      <div className="flex-1 h-px bg-border/40 group-hover:bg-border/60 transition-colors" />
    </div>
  )
}
