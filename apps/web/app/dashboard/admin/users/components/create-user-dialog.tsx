'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
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
import { Loader2 } from 'lucide-react';

interface CreateUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateUserDialog({
  isOpen,
  onOpenChange,
  onCreated,
}: CreateUserDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  // Form states
  const [email, setEmail] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<'operator' | 'assetmanager' | 'admin'>('operator');
  const [organisation, setOrganisation] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');
  const [flyerId, setFlyerId] = React.useState('');
  const [operatorId, setOperatorId] = React.useState('');

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setEmail('');
      setFirstName('');
      setLastName('');
      setPassword('');
      setRole('operator');
      setOrganisation('');
      setContactPhone('');
      setFlyerId('');
      setOperatorId('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !firstName.trim() || !lastName.trim() || !password.trim()) {
      toast.warning('Please fill in all required fields');
      return;
    }

    if (password.length < 8) {
      toast.warning('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        role,
        organisation: organisation.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      };

      if (role === 'operator') {
        payload.flyerId = flyerId.trim() || undefined;
        payload.operatorId = operatorId.trim() || undefined;
      }

      const res = await adminService.createUser(payload);

      if (res.success) {
        toast.success(res.message || 'User created successfully');
        onOpenChange(false);
        onCreated();
      } else {
        toast.error(res.message || 'Failed to create user');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while creating user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create User Account</DialogTitle>
          <DialogDescription>
            Register a new operator, asset owner, or administrator.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={role}
                onValueChange={(val: any) => setRole(val)}
                disabled={isLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="assetmanager">Asset Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone Number</Label>
              <Input
                id="contactPhone"
                placeholder="+44 7123 456789"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organisation">Organisation</Label>
            <Input
              id="organisation"
              placeholder="Company Name"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {role === 'operator' && (
            <div className="grid grid-cols-2 gap-4 border-t pt-4 border-border/40">
              <div className="space-y-2">
                <Label htmlFor="flyerId">Flyer ID</Label>
                <Input
                  id="flyerId"
                  placeholder="GBR-RP-..."
                  value={flyerId}
                  onChange={(e) => setFlyerId(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operatorId">Operator Reference</Label>
                <Input
                  id="operatorId"
                  placeholder="OP-..."
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="font-semibold">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
