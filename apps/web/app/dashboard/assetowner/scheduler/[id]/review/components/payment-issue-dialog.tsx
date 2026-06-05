import * as React from 'react'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'

interface PaymentIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWaitAndTryLater: () => void
  onDeclineRequest: () => void
}

export function PaymentIssueDialog({
  open,
  onOpenChange,
  onWaitAndTryLater,
  onDeclineRequest,
}: PaymentIssueDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <ShieldAlert className="h-5 w-5" />
            <DialogTitle>Approval Blocked: Payment Issue</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            The operator could not be charged for this access request. We have
            sent a notification to the operator asking them to add or update
            their payment method.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            What would you like to do?
          </p>
          <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-2">
            <li>
              <strong>Wait and Try Later</strong>: Keep the request pending. You
              can try approving again once the operator updates their payment
              method.
            </li>
            <li>
              <strong>Decline Request</strong>: Reject this request immediately
              due to the payment issue. The operator will see the decline
              reason.
            </li>
          </ul>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onWaitAndTryLater}
          >
            Wait and Try Later
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto font-semibold"
            onClick={onDeclineRequest}
          >
            Decline Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
