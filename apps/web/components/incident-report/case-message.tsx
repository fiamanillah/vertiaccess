'use client'

import * as React from 'react'
import { Message } from '../../app/dashboard/components/incident-report/types'
import { cn } from '@workspace/ui/lib/utils'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/avatar'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'
import { format } from 'date-fns'
import { Paperclip, FileText, ExternalLink } from 'lucide-react'
import Image from 'next/image'

function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
    case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
    case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
  }
}

interface CaseMessageProps {
  message: Message
  showAdminName?: boolean
}

export function CaseMessage({
  message,
  showAdminName = false,
}: CaseMessageProps) {
  const isAdmin = message.sender === 'admin'

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 shadow-none border',
        isAdmin && 'border-primary/20 bg-primary/5',
      )}
    >
      <CardHeader className="pb-1 pt-2 flex flex-row items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {isAdmin ? (
              <div className="h-full w-full bg-primary flex items-center justify-center text-primary-foreground relative overflow-hidden">
                <Image src="/icon.png" alt="Support" fill className="object-contain p-1" />
              </div>
            ) : (
              <>
                <AvatarImage src={message.senderAvatar} />
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold uppercase">
                  {message.senderName.charAt(0)}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm leading-none">
                {isAdmin
                  ? showAdminName
                    ? message.senderName
                    : 'VertiAccess Support'
                  : 'You'}
              </p>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs">
                  Official
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(message.timestamp), 'MMM d, yyyy @ h:mm a')}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {message.category ? (
          <div className="space-y-4 bg-muted/10 border border-border/40 p-4.5 rounded-xl">
            <div className="flex justify-between items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Incident Category</span>
                <p className="text-xs font-bold capitalize text-foreground">{message.category.replace(/_/g, ' ')}</p>
              </div>
              {message.priority && (
                <div className="space-y-1 text-right">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Severity</span>
                  <Badge variant="outline" className={cn("capitalize text-[10px] px-2.5 py-0 h-5 font-semibold", getPriorityColor(message.priority))}>
                    {message.priority}
                  </Badge>
                </div>
              )}
            </div>
            
            <Separator className="bg-border/30" />

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Incident Description</span>
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-foreground">
                {message.content}
              </p>
            </div>

            {message.impactAssessment && message.impactAssessment.length > 0 && (
              <>
                <Separator className="bg-border/30" />
                <div className="space-y-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Impact Assessment</span>
                  <div className="flex flex-wrap gap-1.5">
                    {message.impactAssessment.map((impact) => (
                      <Badge key={impact} variant="secondary" className="bg-muted/60 text-[10px] font-semibold border-border/40 py-0.5 px-2">
                        {impact}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-foreground">
            {message.content}
          </p>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              Evidence & Documents
            </div>

            {/* File List */}
            <div className="space-y-1">
              {message.attachments.map((attachment, i) => (
                <div
                  key={attachment.id || i}
                  className="flex items-center justify-between p-1.5 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {attachment.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {attachment.size} • {attachment.type}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                    <a href={attachment.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
