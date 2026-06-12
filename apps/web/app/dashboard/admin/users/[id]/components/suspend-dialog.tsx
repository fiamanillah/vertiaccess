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
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Loader2 } from 'lucide-react';

interface SuspendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, durationDays?: number) => Promise<void>;
  isPending: boolean;
}

export function SuspendDialog({ isOpen, onClose, onConfirm, isPending }: SuspendDialogProps) {
  const [reason, setReason] = React.useState('');
  const [duration, setDuration] = React.useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setDuration('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    const durationDays = duration ? parseInt(duration, 10) : undefined;
    await onConfirm(reason, durationDays);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suspend User Account</DialogTitle>
          <DialogDescription>
            Suspend user credentials, block sign-ins, and restrict dashboard access.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="suspendReason">Suspension Reason</Label>
            <Input
              id="suspendReason"
              placeholder="Reason for suspension (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suspendDuration">Duration (Days)</Label>
            <Input
              id="suspendDuration"
              type="number"
              placeholder="Permanent / Indefinite"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={isPending}
            />
          </div>
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
              type="submit"
              variant="destructive"
              disabled={isPending || !reason.trim()}
              className="font-semibold"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Suspend
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
