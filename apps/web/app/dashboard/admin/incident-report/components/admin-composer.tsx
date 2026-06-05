'use client'

import * as React from 'react'
import { MessageVisibility } from '@/app/dashboard/components/incident-report/types'
import { Button } from '@workspace/ui/components/button'
import { Textarea } from '@workspace/ui/components/textarea'
import { Card, CardContent } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'
import {
  Send,
  Paperclip,
  ChevronDown,
  Lock,
  User,
  Building2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { toast } from 'sonner'
import { FileUploader } from '@/components/file-uploader'
import { incidentService } from '@/services/incident.service'
import { mapIncidentToTicket } from '@/services/incident.types'
import type { Ticket } from '@/app/dashboard/components/incident-report/types'
import type { UploadedFileMetadata } from '@/services/media.service'

interface AdminComposerProps {
  incidentId: string
  channel: MessageVisibility
  reporterRole?: 'operator' | 'assetowner' | 'admin'
  targetRole?: 'operator' | 'assetowner' | 'admin'
  onSubmitted: (ticket: Ticket) => void
}

export function AdminComposer({
  incidentId,
  channel,
  reporterRole,
  targetRole,
  onSubmitted,
}: AdminComposerProps) {
  const [content, setContent] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showUploader, setShowUploader] = React.useState(false)
  const [attachments, setAttachments] = React.useState<UploadedFileMetadata[]>(
    [],
  )

  const isInternal = channel === 'internal'
  const isTarget = channel === 'target'

  const getChannelIcon = () => {
    if (isInternal) return <Lock className="h-4 w-4" />
    if (isTarget) return <Building2 className="h-4 w-4" />
    return <User className="h-4 w-4" />
  }

  const reporterLabel = reporterRole === 'assetowner' ? 'Asset Owner' : 'Operator'
  const targetLabel = targetRole === 'assetowner' ? 'Asset Owner' : 'Operator'

  const getChannelLabel = () => {
    if (isInternal) return 'Internal Note (Hidden)'
    if (isTarget) return `Message to ${targetLabel}`
    return `Message to ${reporterLabel}`
  }

  const handleSend = async () => {
    if (!content.trim()) return
    setIsSubmitting(true)
    try {
      const incident = await incidentService.addIncidentMessage(incidentId, {
        messageText: content,
        visibility: channel,
        attachments: attachments.map((attachment) => ({
          fileName: attachment.fileName,
          documentType: 'evidence',
          fileSize: String(attachment.fileSize),
          fileKey: attachment.fileKey,
        })),
      })
      toast.success(
        isInternal ? 'Internal note added' : 'Official message sent',
      )
      onSubmitted(mapIncidentToTicket(incident))
      setContent('')
      setAttachments([])
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* Channel Indicator */}
        <div className="flex items-center justify-between">
          <Badge
            variant={isInternal ? 'secondary' : 'outline'}
            className="flex items-center gap-2"
          >
            {getChannelIcon()}
            <span className="text-xs">{getChannelLabel()}</span>
          </Badge>
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <Textarea
            placeholder={
              isInternal
                ? 'Draft internal assessment...'
                : 'Type official communication...'
            }
            className="min-h-[140px] resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Uploader */}
        {showUploader && (
          <div className="space-y-2 py-2">
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Paperclip className="h-3 w-3" />
              Attach Documents
            </div>
            <FileUploader
              maxSize={15}
              className="w-full"
              onUploadComplete={setAttachments}
            />
          </div>
        )}

        <Separator className="my-2" />

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUploader(!showUploader)}
            className={showUploader ? 'bg-muted' : ''}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {isInternal ? (
            <Button
              onClick={handleSend}
              disabled={!content.trim() || isSubmitting}
            >
              Add Internal Note
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSend}
                disabled={!content.trim() || isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!content.trim() || isSubmitting}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => void handleSend()}>
                    Send as Open
                  </DropdownMenuItem>
                  <DropdownMenuItem>Send as Resolved</DropdownMenuItem>
                  <DropdownMenuItem>Send as Pending</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
