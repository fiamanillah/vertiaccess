'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { CreditCard, type CreditCardProps } from './credit-card';
import { AddCardModal } from './add-card-modal';

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
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleMakeDefault = (id: string) => {
    setCards((prev) =>
      prev.map((card) => ({
        ...card,
        isDefault: card.id === id,
      }))
    );
  };

  const handleRemove = (id: string) => {
    setCards((prev) => {
      const filtered = prev.filter((card) => card.id !== id);
      // If we removed the default card, make the first remaining card default
      if (filtered.length > 0 && !filtered.some((c) => c.isDefault)) {
        return filtered.map((card, index) => 
          index === 0 ? { ...card, isDefault: true } : card
        );
      }
      return filtered;
    });
  };

  const handleAddCardSuccess = (cardData: { type: string; lastFour: string; name: string; expiry: string }) => {
    const newCard: CreditCardProps = {
      id: Math.random().toString(36).substr(2, 9),
      ...cardData,
      isDefault: cards.length === 0,
    };
    setCards((prev) => [...prev, newCard]);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-stretch">
      {cards.map((card) => (
        <CreditCard
          key={card.id}
          {...card}
          onMakeDefault={handleMakeDefault}
          onRemove={handleRemove}
          className="h-full"
        />
      ))}

      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full max-w-[350px] aspect-[1.6/1] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-muted-foreground/20 rounded-2xl p-6 hover:border-primary/50 hover:bg-primary/5 transition-all group"
      >
        <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
          <Plus className="text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <span className="font-semibold text-muted-foreground group-hover:text-primary transition-colors">
          Add New Card
        </span>
      </button>

      <AddCardModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSuccess={handleAddCardSuccess} 
      />
    </div>
  );
}
