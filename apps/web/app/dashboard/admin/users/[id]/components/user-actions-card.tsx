'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { SuspendDialog } from './suspend-dialog';
import { PaymentLockDialog } from './payment-lock-dialog';
import { BanDialog } from './ban-dialog';
import { DeactivateDialog } from './deactivate-dialog';
import { StatusOverrideDialog } from './status-override-dialog';

interface UserActionsCardProps {
  user: {
    id: string;
    email: string;
    status: string;
    suspendedReason?: string;
    suspendedUntil?: string | null;
  };
  onActionComplete: () => void;
}

export default function UserActionsCard({ user, onActionComplete }: UserActionsCardProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  // Dialog open states
  const [isSuspendOpen, setIsSuspendOpen] = React.useState(false);
  const [isLockOpen, setIsLockOpen] = React.useState(false);
  const [isBanOpen, setIsBanOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [statusToOverride, setStatusToOverride] = React.useState<string | null>(null);

  const handleStatusSelectChange = (newStatus: string) => {
    if (newStatus === 'SUSPENDED') {
      setIsSuspendOpen(true);
    } else if (newStatus === 'PAYMENT_LOCKED') {
      setIsLockOpen(true);
    } else {
      setStatusToOverride(newStatus);
    }
  };

  const onStatusOverrideConfirm = async () => {
    if (!statusToOverride) return;
    setIsPending(true);
    try {
      const res = await adminService.updateUserStatus(user.id, statusToOverride);
      if (res.success) {
        toast.success('Account status updated successfully');
        setStatusToOverride(null);
        onActionComplete();
      } else {
        toast.error(res.message || 'Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setIsPending(false);
    }
  };

  const onSuspendConfirm = async (reason: string, durationDays?: number) => {
    setIsPending(true);
    try {
      const res = await adminService.suspendUser(user.id, reason, durationDays);
      if (res.success) {
        toast.success('Account suspended successfully');
        setIsSuspendOpen(false);
        onActionComplete();
      } else {
        toast.error(res.message || 'Failed to suspend account');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to suspend account');
    } finally {
      setIsPending(false);
    }
  };

  const onLockConfirm = async (reason: string) => {
    setIsPending(true);
    try {
      const res = await adminService.paymentLockUser(user.id, reason);
      if (res.success) {
        toast.success('Account locked due to payment issues');
        setIsLockOpen(false);
        onActionComplete();
      } else {
        toast.error(res.message || 'Failed to lock account');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to lock account');
    } finally {
      setIsPending(false);
    }
  };

  const onBanConfirm = async (reason: string) => {
    setIsPending(true);
    try {
      const res = await adminService.banUser(user.id, reason);
      if (res.success) {
        toast.success('Account permanently banned');
        setIsBanOpen(false);
        onActionComplete();
      } else {
        toast.error(res.message || 'Failed to ban account');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to ban account');
    } finally {
      setIsPending(false);
    }
  };

  const onDeleteConfirm = async () => {
    setIsPending(true);
    try {
      await adminService.deleteUser(user.id);
      toast.success('Account deactivated and deleted successfully');
      setIsDeleteOpen(false);
      router.push('/dashboard/admin/users');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsPending(false);
    }
  };

  const handleReinstate = async () => {
    setIsPending(true);
    try {
      const res = await adminService.reinstateUser(user.id);
      if (res.success) {
        toast.success('Account reinstated successfully');
        onActionComplete();
      } else {
        toast.error(res.message || 'Failed to reinstate account');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reinstate account');
    } finally {
      setIsPending(false);
    }
  };

  // Convert user.status string to database status enum string
  const currentDbStatus =
    user.status === 'active'
      ? 'VERIFIED'
      : user.status === 'pending_verification'
      ? 'UNVERIFIED'
      : user.status === 'suspended'
      ? 'SUSPENDED'
      : user.status === 'payment_locked'
      ? 'PAYMENT_LOCKED'
      : 'UNVERIFIED';

  return (
    <>
      <Card className="border shadow-sm bg-card">
        <CardHeader className="bg-muted/10 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <span>Administrative Operations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {user.status === 'suspended' && (
            <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-xs text-red-600 flex items-center justify-between gap-4">
              <div className="flex gap-2 items-center">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Suspended:</strong> {user.suspendedReason || 'No reason provided'}
                  {user.suspendedUntil && ` (Until ${new Date(user.suspendedUntil).toLocaleDateString()})`}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Action 1: Account Status Override */}
            <div className="space-y-2">
              <Label htmlFor="statusSelector" className="font-semibold text-sm">Status Override</Label>
              <Select
                value={currentDbStatus}
                onValueChange={handleStatusSelectChange}
                disabled={isPending}
              >
                <SelectTrigger id="statusSelector" className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VERIFIED">Verified / Active</SelectItem>
                  <SelectItem value="UNVERIFIED">Pending Verification</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="PAYMENT_LOCKED">Payment Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action 2: Suspend / Reinstate */}
            <div className="flex flex-col justify-end">
              {user.status === 'suspended' ? (
                <Button
                  onClick={handleReinstate}
                  disabled={isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Reinstate Account
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsSuspendOpen(true)}
                  disabled={isPending}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
                >
                  Suspend Account
                </Button>
              )}
            </div>

            {/* Action 3: Payment Lock & Ban */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsLockOpen(true)}
                disabled={isPending || user.status === 'payment_locked' || user.status === 'suspended'}
                className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-semibold"
              >
                Payment Lock
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsBanOpen(true)}
                disabled={isPending}
                className="flex-1 border-zinc-700 text-zinc-700 dark:text-zinc-300 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
              >
                Ban
              </Button>
            </div>

            {/* Action 4: Deactivate */}
            <div>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteOpen(true)}
                className="w-full font-semibold"
                disabled={isPending}
              >
                Deactivate Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Components */}
      <SuspendDialog
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        onConfirm={onSuspendConfirm}
        isPending={isPending}
      />

      <PaymentLockDialog
        isOpen={isLockOpen}
        onClose={() => setIsLockOpen(false)}
        onConfirm={onLockConfirm}
        isPending={isPending}
      />

      <BanDialog
        isOpen={isBanOpen}
        onClose={() => setIsBanOpen(false)}
        onConfirm={onBanConfirm}
        isPending={isPending}
      />

      <DeactivateDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={onDeleteConfirm}
        isPending={isPending}
      />

      <StatusOverrideDialog
        isOpen={statusToOverride !== null}
        onClose={() => setStatusToOverride(null)}
        onConfirm={onStatusOverrideConfirm}
        isPending={isPending}
        targetStatus={statusToOverride || ''}
      />
    </>
  );
}
