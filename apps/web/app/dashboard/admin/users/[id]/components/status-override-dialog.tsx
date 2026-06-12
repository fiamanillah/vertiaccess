'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Loader2 } from 'lucide-react';

interface StatusOverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  targetStatus: string;
}

export function StatusOverrideDialog({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  targetStatus,
}: StatusOverrideDialogProps) {
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return {
          title: 'Mark Account as Verified',
          description: 'This will override the user\'s status to VERIFIED. The user will be reinstated and have full system access.',
        };
      case 'UNVERIFIED':
        return {
          title: 'Mark Account as Pending Verification',
          description: 'This will override the user\'s status to UNVERIFIED. The user will be required to go through profile or site verification reviews before active booking privileges are granted.',
        };
      case 'PAYMENT_LOCKED':
        return {
          title: 'Mark Account as Payment Locked',
          description: 'This will override the user\'s status to PAYMENT_LOCKED. The user will be locked out of dashboard operations due to payment issues.',
        };
      case 'SUSPENDED':
        return {
          title: 'Suspend Account',
          description: 'This will suspend the user account. The user will be redirected to the account suspended page.',
        };
      default:
        return {
          title: 'Override User Status',
          description: `Are you sure you want to manually change this user's account status to ${status}?`,
        };
    }
  };

  const details = getStatusDetails(targetStatus);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{details.title}</DialogTitle>
          <DialogDescription>{details.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="font-semibold"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirm Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
