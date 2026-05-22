'use client'

import * as React from 'react'
import {
  Ticket,
  ThreadItem,
  MessageVisibility,
} from '@/app/dashboard/components/incident-report/types'
import { CaseMessage } from '@/components/incident-report'
import { SystemActionLog } from '@/components/incident-report/system-action-log'
import { IncidentReportEditor } from './incident-report-editor'
import { Separator } from '@workspace/ui/components/separator'
import { AlertCircle, MessageSquare } from 'lucide-react'
import { differenceInDays, format } from 'date-fns'

interface CaseThreadProps {
  ticket: Ticket
  incidentId: string
  replyVisibility: MessageVisibility
  onTicketUpdate: (ticket: Ticket) => void
}

function getTimeLabel(date: Date): string {
  const now = new Date()
  const days = differenceInDays(now, date)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return format(date, 'MMM d')
}

export function CaseThread({ ticket, incidentId, replyVisibility, onTicketUpdate }: CaseThreadProps) {
  // Group messages by sender for better visual flow
  const groupedMessages = React.useMemo(() => {
    const groups: {
      senderName: string
      date: Date
      messages: typeof ticket.thread
    }[] = []

    ticket.thread.forEach((msg) => {
      if (msg.type === 'message') {
        const msgDate = new Date(msg.timestamp)
        const dateStr = format(msgDate, 'yyyy-MM-dd')
        const lastGroup = groups[groups.length - 1]

        if (
          lastGroup &&
          lastGroup.senderName === msg.senderName &&
          format(lastGroup.date, 'yyyy-MM-dd') === dateStr
        ) {
          lastGroup.messages.push(msg)
        } else {
          groups.push({
            senderName: msg.senderName,
            date: msgDate,
            messages: [msg],
          })
        }
      }
    })

    return groups
  }, [ticket.thread])

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Thread Header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Conversation Timeline
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete communication history
          </p>
        </div>
      </div>

      {/* Original Report (Pinned at Start) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          Initial Report Submission
        </div>
        <CaseMessage
          message={{
            id: 'original',
            type: 'message',
            sender: 'user',
            senderName: ticket.operatorName,
            content: ticket.description,
            timestamp: ticket.createdAt,
            visibility: 'reporter',
            attachments: ['evidence_1.png', 'evidence_2.png'],
          }}
        />
      </div>

      {ticket.thread.length > 0 && (
        <>
          <Separator />

          {/* Grouped Messages */}
          <div className="space-y-8">
            {groupedMessages.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <span>{group.senderName}</span>
                  <span className="text-muted-foreground/60">
                    • {getTimeLabel(group.date)}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.messages.map(
                    (msg) =>
                      msg.type === 'message' && (
                        <CaseMessage key={msg.id} message={msg} />
                      ),
                  )}
                </div>
              </div>
            ))}
            {ticket.thread
              .filter((item) => item.type === 'action')
              .map((item) => (
                <SystemActionLog key={item.id} log={item} />
              ))}
          </div>

          <Separator />
        </>
      )}

      {/* Response Zone */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            Your Response
          </h3>
          <p className="text-xs text-muted-foreground">
            Provide professional clarification or additional evidence to support
            your case.
          </p>
        </div>
        <IncidentReportEditor
          incidentId={incidentId}
          visibility={replyVisibility}
          onSubmitted={onTicketUpdate}
        />
      </div>
    </div>
  )
}
