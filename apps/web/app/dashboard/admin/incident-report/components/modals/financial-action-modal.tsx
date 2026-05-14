'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import { Label } from '@workspace/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Alert, AlertDescription } from '@workspace/ui/components/alert'
import { DollarSign, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface FinancialActionModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  bookingRef: string
}

export function FinancialActionModal({
  isOpen,
  onClose,
  ticketId,
  bookingRef,
}: FinancialActionModalProps) {
  const [action, setAction] = React.useState<'refund' | 'charge' | 'partial'>(
    'refund',
  )
  const [amount, setAmount] = React.useState('150.00')
  const [reason, setReason] = React.useState('')
  const [isExecuting, setIsExecuting] = React.useState(false)

  const handleExecute = async () => {
    if (!reason.trim()) return
    setIsExecuting(true)

    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast.success(
      `Financial action executed: £${amount} ${action} processed for ${bookingRef}`,
    )
    setIsExecuting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Process Financial Adjustment
          </DialogTitle>
          <DialogDescription>
            Execute a financial adjustment for booking {bookingRef}. This action
            is final and will be logged in the investigation timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Action Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="action-type">Adjustment Type</Label>
            <Select
              value={action}
              onValueChange={(value: any) => setAction(value)}
            >
              <SelectTrigger id="action-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="refund">Full Refund</SelectItem>
                <SelectItem value="partial">Partial Refund</SelectItem>
                <SelectItem value="charge">Force Charge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Adjustment Amount (£)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-9"
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Audit Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain the legal/financial justification for this adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Forcing a charge without evidence may result in legal escalation
              or payment disputes.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExecute}
            disabled={!reason.trim() || isExecuting}
          >
            {isExecuting ? 'Executing...' : 'Execute Adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
