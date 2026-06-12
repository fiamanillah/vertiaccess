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
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeactivateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

export function DeactivateDialog({ isOpen, onClose, onConfirm, isPending }: DeactivateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/35 mb-2">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-center">Deactivate & Purge Account</DialogTitle>
          <DialogDescription className="text-center">
            Are you absolutely sure you want to deactivate and delete this account? This will soft-delete the user record, disable Cognito sign-ins immediately, and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full sm:w-auto font-semibold"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Yes, Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
