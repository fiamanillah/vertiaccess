'use client'

import React from 'react'
import {
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card'
import { cn } from '@workspace/ui/lib/utils'
import { NotificationFormValues } from '../types'

interface NotificationPreviewProps {
  values: Partial<NotificationFormValues>
}

export function NotificationPreview({ values }: NotificationPreviewProps) {
  const { title, message, type = 'info', actionUrl } = values

  const getIcon = (t: string) => {
    switch (t) {
      case 'success':
        return <CheckCheck className="h-4 w-4 text-emerald-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-sky-500" />
    }
  }

  const getTypeStyles = (t: string) => {
    switch (t) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20',
          badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        }
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20',
          badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        }
      case 'error':
        return {
          bg: 'bg-red-500/10 border-red-500/20',
          badge: 'bg-red-500/10 text-red-700 dark:text-red-400',
        }
      default:
        return {
          bg: 'bg-sky-500/10 border-sky-500/20',
          badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
        }
    }
  }

  const styles = getTypeStyles(type)

  const hasContent = title || message

  return (
    <Card className="border shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Live Preview</CardTitle>
        <CardDescription>
          See how this notification will appear to users in their notification panel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mock Notification Dropdown Container */}
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              User Inbox Preview
            </span>
            <span className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2 text-[9px] font-black text-primary">
              1 NEW
            </span>
          </div>

          {/* Simulated Notification Row */}
          <div className="relative flex gap-4 p-4 bg-primary/[0.01]">
            {/* Icon Column */}
            <div className="mt-0.5 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background shadow-xs">
                {getIcon(type)}
              </div>
            </div>

            {/* Details Column */}
            <div className="flex flex-col gap-1 pr-4 w-full">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-bold text-[13px] tracking-tight text-foreground",
                    !title && "text-muted-foreground/40 italic"
                  )}
                >
                  {title || 'No Title Provided'}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              <p
                className={cn(
                  "text-[11px] leading-relaxed text-muted-foreground break-words whitespace-pre-wrap",
                  !message && "text-muted-foreground/30 italic"
                )}
              >
                {message || 'Type your message in the form to see it render here.'}
              </p>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40 mt-1">
                Just now
              </span>

              {actionUrl && (
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-primary font-medium hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  <span>View Details</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technical metadata helper card */}
        {hasContent && (
          <div className={cn("p-3 rounded-lg border text-xs space-y-1.5", styles.bg)}>
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[9px] text-muted-foreground">
                Broadcast Metadata
              </span>
              <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm", styles.badge)}>
                {type}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              <strong>Payload size:</strong> ~{(title?.length || 0) + (message?.length || 0)} chars
              {actionUrl && (
                <>
                  <br />
                  <strong>Target action:</strong> {actionUrl}
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
