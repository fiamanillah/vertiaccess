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
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe-client';
import { createSetupIntent } from '../../actions';
import { toast } from 'sonner';
import { Loader2, CreditCard, Check, ShieldCheck } from 'lucide-react';
import { useTheme } from 'next-themes';
import { paymentService, type PaymentMethod } from '@/services/payments/payment.service';
import { subscriptionService } from '@/services/subscription.service';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    id: string;
    name: string;
    price: number;
    billingType: 'subscription' | 'payg';
    currency: string;
  } | null;
  interval: 'month' | 'year';
  onSuccess: () => void;
}

function CheckoutForm({ 
  plan, 
  interval, 
  onSuccess, 
  onCancel 
}: { 
  plan: NonNullable<CheckoutModalProps['plan']>; 
  interval: 'month' | 'year'; 
  onSuccess: () => void; 
  onCancel: () => void 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { resolvedTheme } = useTheme();
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = React.useState<string>('new');
  const [cardholderName, setCardholderName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingCards, setIsLoadingCards] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const fetchCards = async () => {
      try {
        const cards = await paymentService.getPaymentMethods();
        setPaymentMethods(cards);
        const defaultCard = cards.find(c => c.isDefault);
        if (defaultCard) {
          setSelectedMethodId(defaultCard.stripePaymentMethodId);
        } else if (cards.length > 0 && cards[0]) {
          setSelectedMethodId(cards[0].stripePaymentMethodId);
        }
      } catch (err) {
        console.error('Failed to load payment methods:', err);
      } finally {
        setIsLoadingCards(false);
      }
    };
    fetchCards();
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let finalPaymentMethodId = selectedMethodId;

      // Case 1: Using a new card
      if (selectedMethodId === 'new') {
        if (!stripe || !elements) {
          toast.error('Stripe was not loaded correctly.');
          setIsSubmitting(false);
          return;
        }

        const { clientSecret, error: setupError } = await createSetupIntent();
        if (setupError || !clientSecret) {
          toast.error(setupError || 'Failed to initialize payment setup');
          setIsSubmitting(false);
          return;
        }

        const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: { name: cardholderName },
          },
        });

        if (error) {
          toast.error(error.message || 'Failed to confirm card setup');
          setIsSubmitting(false);
          return;
        }

        if (setupIntent && setupIntent.status === 'succeeded') {
          // Save card in system first
          const savedCard = await paymentService.savePaymentMethod(setupIntent.payment_method as string, true);
          finalPaymentMethodId = savedCard.stripePaymentMethodId;
        } else {
          toast.error('Failed to setup card');
          setIsSubmitting(false);
          return;
        }
      }

      // Case 2: Process the subscription activation
      const activateRes = await subscriptionService.activatePlan({
        planId: plan.id,
        paymentMethodId: finalPaymentMethodId,
        interval: plan.billingType === 'payg' ? undefined : interval,
      });

      if (activateRes.success) {
        toast.success(`Successfully activated the ${plan.name} plan!`);
        onSuccess();
      } else {
        toast.error(activateRes.message || 'Failed to activate the plan.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrencySymbol = (cur: string) => {
    switch (cur.toUpperCase()) {
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return '£';
    }
  };

  const planPrice = plan.billingType === 'payg' 
    ? plan.price 
    : interval === 'year' ? plan.price * 0.8 * 12 : plan.price; // Apply 20% discount if annual

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      {/* Plan Summary Section */}
      <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 space-y-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h4 className="font-bold text-foreground">{plan.name}</h4>
            <p className="text-xs text-muted-foreground">
              {plan.billingType === 'payg' ? 'Pay As You Go Plan' : `${interval === 'year' ? 'Annual' : 'Monthly'} Subscription`}
            </p>
          </div>
          <div className="text-right">
            <span className="font-extrabold text-foreground text-lg">
              {getCurrencySymbol(plan.currency)}{planPrice.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              {plan.billingType === 'payg' ? ' / booking' : interval === 'year' ? ' / yr' : ' / mo'}
            </span>
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/20 pt-2 flex justify-between text-xs font-semibold text-foreground relative z-10">
          <span>Due Today:</span>
          <span>
            {plan.billingType === 'payg' 
              ? `${getCurrencySymbol(plan.currency)}0.00 (Platform fees charged on flight)` 
              : `${getCurrencySymbol(plan.currency)}${planPrice.toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Payment Selection */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <CreditCard size={16} className="text-primary" />
          Select Payment Method
        </h4>

        {isLoadingCards ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {paymentMethods.map((pm) => (
              <label
                key={pm.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedMethodId === pm.stripePaymentMethodId
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={pm.stripePaymentMethodId}
                    checked={selectedMethodId === pm.stripePaymentMethodId}
                    onChange={(e) => setSelectedMethodId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="font-medium text-sm text-foreground uppercase">
                    {pm.brand} •••• {pm.last4}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Exp: {pm.expiryMonth}/{pm.expiryYear}
                  </span>
                </div>
                {selectedMethodId === pm.stripePaymentMethodId && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                )}
              </label>
            ))}

            {/* Add New Card option */}
            <label
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                selectedMethodId === 'new'
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="new"
                  checked={selectedMethodId === 'new'}
                  onChange={(e) => setSelectedMethodId(e.target.value)}
                  className="sr-only"
                />
                <span className="font-semibold text-sm text-foreground">
                  Use a new payment card
                </span>
              </div>
              {selectedMethodId === 'new' && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <Check size={12} className="stroke-[3]" />
                </div>
              )}
            </label>
          </div>
        )}
      </div>

      {/* New Card Details Form */}
      {selectedMethodId === 'new' && (
        <div className="space-y-4 p-4 border border-input rounded-xl bg-muted/20 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Cardholder Name</label>
            <input
              type="text"
              required={selectedMethodId === 'new'}
              placeholder="Cardholder name"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Card Details</label>
            <div className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
              <div className="w-full">
                <CardElement 
                  options={{
                    style: {
                      base: {
                        fontSize: '14px',
                        color: isDark ? '#ffffff' : '#09090b',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        '::placeholder': {
                          color: isDark ? '#71717a' : '#a1a1aa',
                        },
                      },
                      invalid: {
                        color: '#ef4444',
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border">
        <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
        <span>Payments are encrypted and securely processed by Stripe.</span>
      </div>

      <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || (selectedMethodId === 'new' && (!stripe || !elements))} 
          className="min-w-[150px] font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            plan.billingType === 'payg' ? 'Confirm PAYG Activation' : 'Subscribe & Pay'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CheckoutModal({ 
  open, 
  onOpenChange, 
  plan, 
  interval, 
  onSuccess 
}: CheckoutModalProps) {
  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Complete Your Upgrade</DialogTitle>
          <DialogDescription className="text-xs">
            Confirm your payment details to start your {plan.name} plan.
          </DialogDescription>
        </DialogHeader>
        
        <Elements stripe={getStripe()}>
          <CheckoutForm 
            plan={plan}
            interval={interval}
            onSuccess={() => {
              onSuccess();
              onOpenChange(false);
            }} 
            onCancel={() => onOpenChange(false)} 
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
