'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { AlertTriangle, ShieldAlert, Send, Paperclip } from 'lucide-react'
import { FileUploader } from '../file-uploader'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { incidentService } from '@/services/incident.service'
import type { UploadedFileMetadata } from '@/services/media.service'

export type UserRole = 'operator' | 'landowner'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  bookingReference: string
  siteId: string
  role: UserRole
  redirectBaseUrl?: string
  initialCategory?: string
}

const CATEGORIES = {
  operator: [
    { value: 'site_access_issue', label: 'Site Access Issue' },
    { value: 'safety_concern', label: 'Safety Concern' },
    { value: 'near_miss', label: 'Near Miss' },
    { value: 'other', label: 'Other' },
  ],
  landowner: [
    { value: 'property_damage', label: 'Property Damage' },
    { value: 'unapproved_flight', label: 'Unapproved Flight' },
    { value: 'landowner_dispute', label: 'Landowner Dispute' },
    { value: 'other', label: 'Other' },
  ],
}

export function ReportModal({
  isOpen,
  onClose,
  bookingId,
  bookingReference,
  siteId,
  role,
  redirectBaseUrl,
  initialCategory,
}: ReportModalProps) {
  const router = useRouter()
  const [category, setCategory] = React.useState<string>(initialCategory || '')
  const [description, setDescription] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [attachments, setAttachments] = React.useState<UploadedFileMetadata[]>(
    [],
  )

  React.useEffect(() => {
    if (initialCategory) setCategory(initialCategory)
  }, [initialCategory])

  const handleSubmit = async () => {
    if (!category || !description) {
      toast.error('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const incident = await incidentService.createIncident({
        bookingId,
        siteId,
        type: category,
        urgency: 'high',
        description,
        attachments: attachments.map((attachment) => ({
          fileName: attachment.fileName,
          documentType: 'evidence',
          fileSize: String(attachment.fileSize),
          fileKey: attachment.fileKey,
        })),
      })

      toast.success('Incident report created successfully.')
      onClose()
      setAttachments([])
      if (redirectBaseUrl) {
        router.push(`${redirectBaseUrl}/${incident.id}`)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create incident report')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-red-600 h-1.5 w-full" />

        <div className="p-6 space-y-6">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-2.5 rounded-xl">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight uppercase">
                  Incident Report
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  Reference: {bookingReference}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="category"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
              >
                Incident Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="category"
                  className="h-11 bg-muted/30 border-border/50 font-medium"
                >
                  <SelectValue placeholder="Select incident type..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES[role].map((cat) => (
                    <SelectItem
                      key={cat.value}
                      value={cat.value}
                      className="text-sm font-medium"
                    >
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
              >
                Detailed Description
              </Label>
              <Textarea
                id="description"
                placeholder="Please describe exactly what happened. Be as specific as possible about times, locations, and personnel involved."
                className="min-h-[120px] bg-muted/30 border-border/50 resize-none font-medium text-sm leading-relaxed"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Paperclip className="h-3 w-3" />
                Evidence & Attachments (Optional)
              </Label>
              <FileUploader
                maxSize={15}
                className="bg-muted/10 border-border/40 "
                onUploadComplete={setAttachments}
              />
              <p className="text-[9px] text-muted-foreground italic px-1">
                Upload photos, CCTV screenshots, or flight logs to support your
                investigation.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              className="sm:flex-1 h-11 font-black text-[10px] uppercase tracking-widest"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="sm:flex-2 h-11 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-red-600/20"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                'Processing...'
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Open Investigation
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
