'use client'

import * as React from 'react'
import {
  Ticket,
  MessageVisibility,
  ThreadItem,
} from '@/app/dashboard/components/incident-report/types'
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import { CaseMessage } from '@/components/incident-report'
import { SystemActionLog } from '@/components/incident-report/system-action-log'
import { AdminComposer } from './admin-composer'
import { Lock, User, Building2, AlertCircle } from 'lucide-react'
import { Separator } from '@workspace/ui/components/separator'
import { differenceInDays, format } from 'date-fns'

interface AdminThreadViewerProps {
  ticket: Ticket
  onTicketUpdate: (ticket: Ticket) => void
}

function getTimeLabel(date: Date): string {
  const now = new Date()
  const days = differenceInDays(now, date)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return format(date, 'MMM d')
}

export function AdminThreadViewer({
  ticket,
  onTicketUpdate,
}: AdminThreadViewerProps) {
  const [activeChannel, setActiveChannel] =
    React.useState<MessageVisibility>('reporter')
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const initialReport = ticket.thread.find((item) => item.type === 'message')

  // Filter items based on channel visibility
  const filteredThread = ticket.thread.filter((item) => {
    if (item.type === 'action') return true
    if (activeChannel === 'internal') return item.visibility === 'internal'
    return item.visibility === activeChannel
  }) as ((typeof ticket.thread)[number] & { visibility?: MessageVisibility })[]

  // Group messages by sender
  const groupedMessages = React.useMemo(() => {
    const groups: {
      senderName: string
      date: Date
      messages: typeof filteredThread
    }[] = []

    filteredThread.forEach((msg) => {
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
  }, [filteredThread])

  React.useEffect(() => {
    // Auto-scroll to bottom on channel switch
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeChannel])

  const getChannelIcon = (channel: MessageVisibility) => {
    if (channel === 'internal') return <Lock className="h-4 w-4" />
    if (channel === 'target') return <Building2 className="h-4 w-4" />
    return <User className="h-4 w-4" />
  }

  const reporterLabel = ticket.reporterRole === 'landowner' ? 'Landowner' : 'Operator'
  const targetLabel = ticket.targetRole === 'landowner' ? 'Landowner' : 'Operator'

  const getChannelLabel = (channel: MessageVisibility) => {
    if (channel === 'internal') return 'Internal'
    if (channel === 'target') return targetLabel
    return reporterLabel
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Initial Investigation Report */}
      {activeChannel === 'reporter' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertCircle className="h-4 w-4" />
            Initial Investigation Report
          </div>
          <CaseMessage
            message={{
              id: 'root',
              type: 'message',
              sender: 'user',
              senderName: ticket.reporterRole === 'landowner' ? ticket.landownerName : ticket.operatorName,
              content: ticket.description,
              timestamp: ticket.createdAt,
              attachments: initialReport?.attachments ?? [],
              visibility: 'reporter',
              category: ticket.category,
              priority: ticket.priority,
              impactAssessment: ticket.impactAssessment,
            }}
          />
        </div>
      )}

      {/* Channel Tabs */}
      <Tabs
        value={activeChannel}
        onValueChange={(v) => setActiveChannel(v as MessageVisibility)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reporter" className="gap-2">
            {getChannelIcon('reporter')}
            {getChannelLabel('reporter')}
          </TabsTrigger>
          <TabsTrigger value="target" className="gap-2">
            {getChannelIcon('target')}
            {getChannelLabel('target')}
          </TabsTrigger>
          <TabsTrigger value="internal" className="gap-2">
            {getChannelIcon('internal')}
            {getChannelLabel('internal')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Messages */}
      {filteredThread.length > 0 ? (
        <div ref={scrollRef} className="space-y-6">
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
                      <CaseMessage
                        key={msg.id}
                        message={msg}
                        showAdminName={true}
                      />
                    ),
                )}
              </div>
            </div>
          ))}
          {filteredThread
            .filter((item) => item.type === 'action')
            .map((item) => (
              <SystemActionLog key={item.id} log={item} />
            ))}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No messages in this channel yet
        </div>
      )}

      <Separator />

      {/* Composer */}
      <AdminComposer
        incidentId={ticket.id}
        channel={activeChannel}
        reporterRole={ticket.reporterRole}
        targetRole={ticket.targetRole}
        onSubmitted={onTicketUpdate}
      />
    </div>
  )
}
