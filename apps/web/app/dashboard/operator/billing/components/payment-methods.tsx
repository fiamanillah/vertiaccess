'use client';

import * as React from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { CreditCard, type CreditCardProps } from './credit-card';
import { AddCardModal } from './add-card-modal';
import { EditCardModal } from './edit-card-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import { toast } from 'sonner';
import { paymentService } from '@/services/payments/payment.service';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function PaymentMethods() {
  const [cards, setCards] = React.useState<CreditCardProps[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // Edit state
  const [editingCardId, setEditingCardId] = React.useState<string | null>(null);

  // Remove state
  const [cardToRemove, setCardToRemove] = React.useState<string | null>(null);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const fetchCards = React.useCallback(async () => {
    try {
      const pmList = await paymentService.getPaymentMethods();
      setCards(pmList.map(pm => ({
        id: pm.id,
        type: pm.brand,
        lastFour: pm.last4,
        name: 'Operator Card',
        expiry: `${pm.expiryMonth}/${String(pm.expiryYear).slice(-2)}`,
        isDefault: pm.isDefault,
      })));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const editingCard = React.useMemo(() => {
    return cards.find(c => c.id === editingCardId) || null;
  }, [cards, editingCardId]);

  const handleMakeDefault = async (id: string) => {
    try {
      await paymentService.setDefaultPaymentMethod(id);
      setCards((prev) =>
        prev.map((card) => ({
          ...card,
          isDefault: card.id === id,
        }))
      );
      toast.success('Default payment method updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update default payment method');
    }
  };

  const confirmRemove = async () => {
    if (!cardToRemove) return;
    setIsRemoving(true);

    try {
      await paymentService.deletePaymentMethod(cardToRemove);
      await fetchCards();
      toast.success('Card removed successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove card');
    } finally {
      setIsRemoving(false);
      setCardToRemove(null);
    }
  };

  const handleAddCardSuccess = () => {
    fetchCards();
  };

  const handleEditCardSuccess = () => {
    fetchCards();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="relative w-full rounded-3xl overflow-hidden border border-border/40 bg-background/50 p-6 flex flex-col justify-between"
            style={{ aspectRatio: '1.586 / 1' }}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-8 w-10 rounded" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            
            <div className="flex justify-between w-full py-2">
              <Skeleton className="h-5 w-1/5 rounded" />
              <Skeleton className="h-5 w-1/5 rounded" />
              <Skeleton className="h-5 w-1/5 rounded" />
              <Skeleton className="h-5 w-1/5 rounded" />
            </div>

            <div className="flex justify-between items-end">
              <div className="space-y-1.5">
                <Skeleton className="h-2 w-16 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <div className="space-y-1.5 text-center">
                <Skeleton className="h-2 w-12 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-7 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 ">
        {cards.map((card) => (
          <CreditCard
            key={card.id}
            {...card}
            onMakeDefault={handleMakeDefault}
            onEdit={(id) => setEditingCardId(id)}
            onRemove={(id) => setCardToRemove(id)}
            className="h-full"
          />
        ))}

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full aspect-[1.6/1] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-muted-foreground/20 rounded-2xl p-6 hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
            <Plus className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="font-semibold text-muted-foreground group-hover:text-primary transition-colors">
            Add New Card
          </span>
        </button>

        <AddCardModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSuccess={handleAddCardSuccess}
        />

        <EditCardModal
          open={!!editingCardId}
          onOpenChange={(open) => !open && setEditingCardId(null)}
          card={editingCard}
          onSuccess={handleEditCardSuccess}
        />
      </div>

      {/* Remove Confirmation Modal */}
      <AlertDialog open={!!cardToRemove} onOpenChange={(open) => !open && !isRemoving && setCardToRemove(null)}>
        <AlertDialogContent className="border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2 text-xl">
              <AlertTriangle size={24} />
              Remove Payment Method
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Are you sure you want to remove this card? Any active subscriptions tied to this card may fail if you don't have another default payment method set.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmRemove} disabled={isRemoving} className="min-w-[140px]">
              {isRemoving ? 'Removing...' : 'Yes, Remove Card'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
