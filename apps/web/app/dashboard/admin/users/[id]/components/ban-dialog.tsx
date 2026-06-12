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

interface BanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isPending: boolean;
}

export function BanDialog({ isOpen, onClose, onConfirm, isPending }: BanDialogProps) {
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await onConfirm(reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Permanent Ban</DialogTitle>
          <DialogDescription>
            Permanently disable this account, cancel all active subscriptions, and block future sign-ins completely.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="banReason">Ban Reason</Label>
            <Input
              id="banReason"
              placeholder="e.g. Violation of Terms of Service (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              required
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
              Confirm Ban
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
