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

const INITIAL_CARDS: CreditCardProps[] = [
  {
    id: '1',
    type: 'visa',
    lastFour: '6888',
    name: 'John Smith',
    expiry: '11/24',
    isDefault: true,
  },
];

export function PaymentMethods() {
  const [cards, setCards] = React.useState<CreditCardProps[]>(INITIAL_CARDS);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // Edit state
  const [editingCardId, setEditingCardId] = React.useState<string | null>(null);

  // Remove state
  const [cardToRemove, setCardToRemove] = React.useState<string | null>(null);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const editingCard = React.useMemo(() => {
    return cards.find(c => c.id === editingCardId) || null;
  }, [cards, editingCardId]);

  const handleMakeDefault = (id: string) => {
    setCards((prev) =>
      prev.map((card) => ({
        ...card,
        isDefault: card.id === id,
      }))
    );
  };

  const confirmRemove = async () => {
    if (!cardToRemove) return;
    setIsRemoving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      setCards((prev) => {
        const filtered = prev.filter((card) => card.id !== cardToRemove);
        // If we removed the default card, make the first remaining card default
        if (filtered.length > 0 && !filtered.some((c) => c.isDefault)) {
          return filtered.map((card, index) =>
            index === 0 ? { ...card, isDefault: true } : card
          );
        }
        return filtered;
      });
      toast.success('Card removed successfully');
    } catch (error) {
      toast.error('Failed to remove card');
    } finally {
      setIsRemoving(false);
      setCardToRemove(null);
    }
  };

  const handleAddCardSuccess = (cardData: { type: string; lastFour: string; name: string; expiry: string }) => {
    const newCard: CreditCardProps = {
      id: Math.random().toString(36).substr(2, 9),
      ...cardData,
      isDefault: cards.length === 0,
    };
    setCards((prev) => [...prev, newCard]);
  };

  const handleEditCardSuccess = (id: string, updatedData: { name: string; expiry: string }) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, ...updatedData } : card
      )
    );
  };

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
