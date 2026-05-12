'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { type CreditCardProps } from './credit-card';

interface EditCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CreditCardProps | null;
  onSuccess: (id: string, data: { name: string; expiry: string }) => void;
}

export function EditCardModal({ open, onOpenChange, card, onSuccess }: EditCardModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [name, setName] = React.useState('');
  const [expiry, setExpiry] = React.useState('');

  React.useEffect(() => {
    if (card && open) {
      setName(card.name);
      setExpiry(card.expiry);
    }
  }, [card, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;

    setIsSubmitting(true);

    try {
      // Simulate API call to update card details
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onSuccess(card.id, { name, expiry });
      toast.success('Card details updated successfully');
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update card details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Card Details</DialogTitle>
          <DialogDescription>
            Update the billing information for your {card?.type.toUpperCase()} ending in {card?.lastFour}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input
                id="card-name"
                type="text"
                required
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-expiry">Expiry Date (MM/YY)</Label>
              <Input
                id="card-expiry"
                type="text"
                required
                placeholder="MM/YY"
                pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
                value={expiry}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length >= 2) {
                    val = val.substring(0, 2) + '/' + val.substring(2, 4);
                  }
                  setExpiry(val);
                }}
                maxLength={5}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
