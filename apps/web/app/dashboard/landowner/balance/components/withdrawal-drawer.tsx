'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui/components/sheet'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'
import { ArrowRight, Loader2, Landmark, Clock3 } from 'lucide-react'

interface WithdrawalDrawerProps {
  open: boolean
  amount: number
  bankLabel: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
  isSubmitting?: boolean
}

export function WithdrawalDrawer({
  open,
  amount,
  bankLabel,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: WithdrawalDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-6 pb-4">
          <Badge variant="secondary" className="mb-3 w-fit">
            Withdrawal Confirmation
          </Badge>
          <SheetTitle className="text-xl font-semibold">
            Review transfer details
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            You are about to transfer £{amount.toFixed(2)} to {bankLabel}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 p-6">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">Payout amount</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">
              £{amount.toFixed(2)}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              Destination account
            </div>
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              {bankLabel}
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Funds typically arrive in 1-2 business days.</p>
          </div>
        </div>

        <SheetFooter className="border-t p-6 pt-4">
          <Button
            className="w-full gap-2"
            onClick={() => void onConfirm()}
            disabled={isSubmitting || amount <= 0}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Confirm Transfer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
