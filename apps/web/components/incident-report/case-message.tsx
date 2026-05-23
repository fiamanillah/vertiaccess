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
import { format } from 'date-fns'
import { Paperclip, Command, FileText, ExternalLink } from 'lucide-react'

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
              <div className="h-full w-full bg-primary flex items-center justify-center text-primary-foreground">
                <Command className="h-4 w-4" />
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
        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-foreground">
          {message.content}
        </p>

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
