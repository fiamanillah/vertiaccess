'use client'

import * as React from 'react'
import { Button } from '@workspace/ui/components/button'
import { Textarea } from '@workspace/ui/components/textarea'
import { Card, CardContent } from '@workspace/ui/components/card'
import { Separator } from '@workspace/ui/components/separator'
import { Paperclip, Send } from 'lucide-react'
import { toast } from 'sonner'
import { FileUploader } from '@/components/file-uploader'
import { incidentService } from '@/services/incident.service'
import { mapIncidentToTicket } from '@/services/incident.types'
import type { Ticket, MessageVisibility } from '@/app/dashboard/components/incident-report/types'

interface IncidentReportEditorProps {
  incidentId: string
  visibility: MessageVisibility
  onSubmitted: (ticket: Ticket) => void
}

export function IncidentReportEditor({
  incidentId,
  visibility,
  onSubmitted,
}: IncidentReportEditorProps) {
  const [content, setContent] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showUploader, setShowUploader] = React.useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setIsSubmitting(true)
    try {
      const updated = await incidentService.addIncidentMessage(incidentId, {
        messageText: content,
        visibility,
      })
      toast.success('Official reply submitted to the Safety Team')
      onSubmitted(mapIncidentToTicket(updated))
      setContent('')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* Textarea Area */}
        <div className="space-y-2">
          <Textarea
            placeholder="Provide a detailed, professional response for the investigation..."
            className="min-h-[160px] resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Upload Zone */}
        {showUploader && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              Attachments
            </div>
            <FileUploader
              maxSize={15}
              className="bg-muted/30 border-border w-full"
            />
          </div>
        )}

        <Separator className="my-2" />

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUploader(!showUploader)}
            className={showUploader ? 'bg-muted' : ''}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            className="gap-2"
            disabled={!content.trim() || isSubmitting}
            onClick={handleSubmit}
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Official Reply'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
