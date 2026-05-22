'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'
import { CreditCard, Plus, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import type { PaymentMethod } from '@/services/booking.types'
import { paymentService } from '@/services/payments/payment.service'
import { AddCardModal } from '@/app/dashboard/operator/billing/components/add-card-modal'
import { toast } from 'sonner'

interface CardSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCard: PaymentMethod | null
  onSelectCard: (card: PaymentMethod) => void
}

export function CardSelectionModal({
  open,
  onOpenChange,
  selectedCard,
  onSelectCard,
}: CardSelectionModalProps) {
  const [cards, setCards] = React.useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [showAddCardModal, setShowAddCardModal] = React.useState(false)

  // Load cards when modal opens
  React.useEffect(() => {
    if (open) {
      loadCards()
    }
  }, [open])

  const loadCards = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const methods = await paymentService.getPaymentMethods()
      setCards(methods)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load payment methods')
      toast.error('Failed to load payment methods')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCardSuccess = async () => {
    await loadCards()
    setShowAddCardModal(false)
    toast.success('Card added successfully. You can now select it.')
  }

  const handleSelectCard = (card: PaymentMethod) => {
    onSelectCard(card)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Select Payment Method
            </DialogTitle>
            <DialogDescription>
              Choose an existing card or add a new one for this booking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading cards...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={loadCards}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : cards.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-center">
                <CreditCard className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  No payment methods found
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Add a card to proceed with booking
                </p>
                <Button
                  onClick={() => setShowAddCardModal(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Card
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left',
                      selectedCard?.id === card.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-background hover:border-primary/50',
                    )}
                  >
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                        <CreditCard className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold capitalize text-foreground">
                        {card.brand}
                      </p>
                      <p className="text-sm font-mono text-muted-foreground">
                        •••• {card.last4}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires {card.expiryMonth}/{card.expiryYear}
                      </p>
                    </div>
                    {card.isDefault && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Default
                        </span>
                      </div>
                    )}
                    {selectedCard?.id === card.id && (
                      <div className="flex-shrink-0">
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="h-3 w-3 text-primary-foreground"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowAddCardModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Card
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedCard) {
                  handleSelectCard(selectedCard)
                }
              }}
              disabled={!selectedCard}
            >
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Card Modal */}
      <AddCardModal
        open={showAddCardModal}
        onOpenChange={setShowAddCardModal}
        onSuccess={handleAddCardSuccess}
      />
    </>
  )
}
