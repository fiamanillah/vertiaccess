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

interface AdminComposerProps {
  channel: MessageVisibility
}

export function AdminComposer({ channel }: AdminComposerProps) {
  const [content, setContent] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showUploader, setShowUploader] = React.useState(false)

  const isInternal = channel === 'internal'
  const isTarget = channel === 'target'

  const getChannelIcon = () => {
    if (isInternal) return <Lock className="h-4 w-4" />
    if (isTarget) return <Building2 className="h-4 w-4" />
    return <User className="h-4 w-4" />
  }

  const getChannelLabel = () => {
    if (isInternal) return 'Internal Note (Hidden)'
    if (isTarget) return 'Message to Landowner'
    return 'Message to Reporter'
  }

  const handleSend = () => {
    if (!content.trim()) return
    setIsSubmitting(true)
    setTimeout(() => {
      toast.success(
        isInternal ? 'Internal note added' : 'Official message sent',
      )
      setContent('')
      setIsSubmitting(false)
    }, 1000)
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
            <FileUploader maxSize={15} className="w-full" />
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
                  <DropdownMenuItem onClick={() => handleSend()}>
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
