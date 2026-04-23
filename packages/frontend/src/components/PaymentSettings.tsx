import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { User } from '../App';
import type { PaymentCard } from '../types';
import { CreditCard, X, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentSettingsProps {
    user: User;
    onUpdateCard?: (card: PaymentCard | undefined) => void;
    onClose: () => void;
    onRefreshPaymentMethods?: () => void;
}

function CardInputForm({
    user,
    onClose,
    onSuccess,
}: {
    user: User;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const { idToken } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [cardholderName, setCardholderName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!stripe || !elements) {
            setError('Stripe is not loaded yet');
            return;
        }

        if (!cardholderName.trim()) {
            setError('Please enter the cardholder name');
            return;
        }

        setIsLoading(true);

        try {
            // Create payment method from card element
            const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
                type: 'card',
                card: elements.getElement(CardElement)!,
                billing_details: {
                    name: cardholderName,
                },
            });

            if (pmError) {
                setError(pmError.message || 'Failed to create payment method');
                setIsLoading(false);
                return;
            }

            if (!paymentMethod) {
                setError('Failed to create payment method');
                setIsLoading(false);
                return;
            }

            // Save payment method to backend
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/billing/v1/payment-methods`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        paymentMethodId: paymentMethod.id,
                        setAsDefault: true,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save payment method');
            }

            toast.success('Card saved successfully');
            onSuccess();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save card';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">Cardholder Name</label>
                <input
                    type="text"
                    value={cardholderName}
                    onChange={e => setCardholderName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">Card Details</label>
                <div className="border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-indigo-500">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#333',
                                    '::placeholder': {
                                        color: '#999',
                                    },
                                },
                                invalid: {
                                    color: '#dc2626',
                                },
                            },
                        }}
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Check className="size-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-green-700">
                        <p className="font-medium mb-1">Secure Payment Processing</p>
                        <p className="text-xs text-green-600">
                            Your card details are encrypted and tokenized by Stripe. We never see
                            your full card number.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={!stripe || !elements || isLoading}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="size-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <CreditCard className="size-5" />
                            Save Card
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

export function PaymentSettings({
    user,
    onUpdateCard,
    onClose,
    onRefreshPaymentMethods,
}: PaymentSettingsProps) {
    const [showAddCard, setShowAddCard] = useState(!user.paymentCard);
    const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { idToken } = useAuth();

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/billing/v1/payment-methods`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setSavedCards(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch payment methods:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveCard = async (cardId: string) => {
        if (confirm('Are you sure you want to remove this payment card?')) {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/billing/v1/payment-methods/${cardId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    }
                );

                if (response.ok) {
                    toast.success('Card removed successfully');
                    setSavedCards(savedCards.filter(card => card.id !== cardId));
                    onRefreshPaymentMethods?.();
                } else {
                    toast.error('Failed to remove card');
                }
            } catch (err) {
                toast.error('Failed to remove card');
            }
        }
    };

    const handleCardSaved = async () => {
        setShowAddCard(false);
        await fetchPaymentMethods();
        
        // Fetch updated payment methods and notify parent of the saved card
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/billing/v1/payment-methods`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                const cards = data.data || [];
                
                // Find the default card or use the first card
                const defaultCard = cards.find((card: any) => card.isDefault) || cards[0];
                
                if (defaultCard && onUpdateCard) {
                    const paymentCard: PaymentCard = {
                        id: defaultCard.id,
                        stripePaymentMethodId: defaultCard.stripePaymentMethodId,
                        last4: defaultCard.last4,
                        brand: defaultCard.brand,
                        expiryMonth: defaultCard.expiryMonth,
                        expiryYear: defaultCard.expiryYear,
                        isDefault: defaultCard.isDefault,
                        addedAt: defaultCard.addedAt || new Date().toISOString(),
                    };
                    onUpdateCard(paymentCard);
                }
            }
        } catch (err) {
            console.error('Failed to update card info:', err);
        }
        
        onRefreshPaymentMethods?.();
    };

    return (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <CreditCard className="size-6 text-indigo-600" />
                        <h2 className="font-semibold">Payment Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="p-6">
                    {user.role === 'landowner' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-blue-900 text-sm">
                                <span className="font-medium">Receive Payments:</span> Add your card
                                details to receive payments from drone operators when they use your
                                TOAL sites.
                            </p>
                        </div>
                    )}

                    {user.role === 'operator' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-blue-900 text-sm">
                                <span className="font-medium">Pay for TOAL Sites:</span> Add your
                                payment card to book TOAL sites. You'll only be charged if the
                                booking is not cancelled before the operation start time.
                            </p>
                        </div>
                    )}

                    {/* Saved Cards List */}
                    {!isLoading && savedCards.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Saved Cards
                            </h3>
                            <div className="space-y-3">
                                {savedCards.map((card: any) => (
                                    <div
                                        key={card.id}
                                        className="border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
                                                    <CreditCard className="size-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {card.brand} •••• {card.last4}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Expires {card.expiryMonth}/{card.expiryYear}
                                                    </p>
                                                </div>
                                                {card.isDefault && (
                                                    <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveCard(card.id)}
                                                className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add Card Form */}
                    {showAddCard && (
                        <div className="border border-gray-200 rounded-lg p-6 mb-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                Add New Card
                            </h3>
                            <Elements stripe={stripePromise}>
                                <CardInputForm
                                    user={user}
                                    onClose={() => setShowAddCard(false)}
                                    onSuccess={handleCardSaved}
                                />
                            </Elements>
                        </div>
                    )}

                    {/* Add Card Button */}
                    {!showAddCard && (
                        <button
                            onClick={() => setShowAddCard(true)}
                            className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-3 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="size-5" />
                            Add New Card
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
