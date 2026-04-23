import { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    CreditCard,
    Lock,
    User,
    Building2,
    Ticket,
    ShieldCheck,
    Loader2,
} from 'lucide-react';
import type { PricingTier } from '../LandingPage';
import { toast } from 'sonner';
import { cognitoSignUp } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { activateBillingPlan, fetchPublicPlans, type BillingPlan } from '../../lib/billing';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY);

interface SignupFormProps {
    activeRole: 'operator' | 'landowner';
    selectedTier?: PricingTier | null;
    onBack: () => void;
    onSignupComplete: (email: string) => void;
}

type OnboardingPlan = PricingTier & {
    id: string;
};

function SignupFormBase({ activeRole, selectedTier, onBack, onSignupComplete }: SignupFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const { confirmSignUp, login, idToken, updateUser } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState<PricingTier | null>(selectedTier || null);
    const [plans, setPlans] = useState<OnboardingPlan[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);
    const [filter, setFilter] = useState<'subscription' | 'payg'>(
        selectedTier?.type || 'subscription'
    );
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        organisation: '',
        flyerId: '',
        operatorId: '',
        verificationCode: '',
        cardNumber: '',
        expiry: '',
        cvc: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentTier = selectedPlan || selectedTier;

    useEffect(() => {
        if (activeRole !== 'operator') return;

        let isMounted = true;
        setIsLoadingPlans(true);

        fetchPublicPlans()
            .then((apiPlans: BillingPlan[]) => {
                if (!isMounted) return;
                const mapped: OnboardingPlan[] = apiPlans
                    .filter(plan => plan.isActive)
                    .map(plan => ({
                        id: plan.id,
                        name: plan.name,
                        price: `£${plan.monthlyPrice}`,
                        unit: plan.unitLabel || (plan.billingType === 'payg' ? '/request' : '/mo'),
                        type: plan.billingType,
                        description: plan.description || '',
                    }));
                setPlans(mapped);
            })
            .catch(() => {
                if (!isMounted) return;
                setPlans([]);
            })
            .finally(() => {
                if (isMounted) setIsLoadingPlans(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeRole]);

    const filteredTiers = plans.filter(t => t.type === filter);

    const selectedPlanRecord = useMemo(() => {
        if (!currentTier) return null;
        return plans.find(plan => plan.name === currentTier.name) || null;
    }, [currentTier, plans]);

    const handleStep1Register = async () => {
        setIsSubmitting(true);
        try {
            const nameParts = formData.fullName.trim().split(/\s+/);
            const firstName = nameParts[0] || 'User';
            const lastName = nameParts.slice(1).join(' ') || 'User';

            await cognitoSignUp({
                email: formData.email,
                password: formData.password,
                firstName,
                lastName,
                role: activeRole,
                organisation: formData.organisation || undefined,
                flyerId: formData.flyerId || undefined,
                operatorId: formData.operatorId || undefined,
            });

            toast.success('Account created! Please verify your email.');
            setStep(2);
        } catch (error: any) {
            const message = error?.message || 'Registration failed. Please try again.';
            if (
                message.includes('User already exists') ||
                message.includes('UsernameExistsException')
            ) {
                toast.error('An account with this email already exists. Please login instead.');
            } else if (
                message.includes('Password did not conform') ||
                message.includes('InvalidPasswordException')
            ) {
                toast.error(
                    'Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters.'
                );
            } else if (
                message.includes('Invalid parameter') ||
                message.includes('InvalidParameterException')
            ) {
                toast.error(
                    'Please check your details. Make sure your email and other fields are correctly formatted.'
                );
            } else {
                toast.error(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStep2Verify = async () => {
        setIsSubmitting(true);
        try {
            await confirmSignUp(formData.email, formData.verificationCode);
            toast.success('Email verified!');
            await login(formData.email, formData.password);
            onSignupComplete(formData.email);
        } catch (error: any) {
            const message = error?.message || 'Verification failed. Please try again.';
            if (message.includes('CodeMismatchException') || message.includes('Invalid code')) {
                toast.error('Incorrect verification code provided. Please try again.');
            } else if (
                message.includes('ExpiredCodeException') ||
                message.includes('Code expired')
            ) {
                toast.error('Verification code has expired. Please request a new one.');
            } else {
                toast.error(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStep4Payment = async () => {
        if (!stripe || !elements) return;
        setIsSubmitting(true);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        if (!idToken) {
            toast.error('Session expired. Please log in again.');
            setIsSubmitting(false);
            return;
        }

        try {
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                toast.error(error.message);
                setIsSubmitting(false);
                return;
            }

            if (!selectedPlanRecord) {
                throw new Error('Selected plan is not available. Please reselect your plan.');
            }

            await activateBillingPlan({
                idToken,
                planId: selectedPlanRecord.id,
                paymentMethodId: paymentMethod.id,
                interval: selectedPlanRecord.type === 'subscription' ? 'month' : undefined,
            });

            updateUser({
                planTier: selectedPlanRecord.name,
                subscriptionStatus: 'ACTIVE',
                isPAYG: selectedPlanRecord.type === 'payg',
            });

            toast.success('Account subscription complete!');
            onSignupComplete(formData.email);
        } catch (e: any) {
            toast.error(e.message || 'Failed to setup subscription');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = async (e: React.FormEvent) => {
        e.preventDefault();

        if (activeRole === 'operator') {
            if (step === 1) {
                await handleStep1Register();
            } else if (step === 2) {
                await handleStep2Verify();
            } else if (step === 3) {
                if (!selectedPlan) {
                    toast.error('Please select a plan to continue');
                    return;
                }
                setStep(4);
            } else if (step === 4) {
                await handleStep4Payment();
            }
        } else if (activeRole === 'landowner') {
            if (step === 1) {
                await handleStep1Register();
            } else if (step === 2) {
                await handleStep2Verify();
            }
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-6 py-12">
            <div className="max-w-[1000px] w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col lg:flex-row">
                {/* Left Side: Summary */}
                <div className="lg:w-[380px] bg-blue-600 p-10 lg:p-14 text-white flex flex-col">
                    <button
                        onClick={() => {
                            if (step > 1) {
                                setStep(step - 1);
                            } else {
                                if (selectedTier) onBack();
                                else onBack();
                            }
                        }}
                        className="flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white transition-colors mb-16 self-start"
                    >
                        <ArrowLeft className="size-4" />
                        Back
                    </button>

                    <div className="mb-16">
                        <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">
                            Registration Progress
                        </p>
                        <h2 className="text-4xl font-bold mb-4 text-white">
                            {activeRole === 'operator' ? 'Operator' : 'Landowner'}
                        </h2>
                        {activeRole === 'operator' && currentTier && step > 1 && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <p className="text-xs text-white/50 uppercase font-bold tracking-widest mb-2">
                                    Selected Plan
                                </p>
                                <p className="text-xl font-bold text-slate-50">
                                    {currentTier.name}
                                </p>
                                <p className="text-white/70">
                                    {currentTier.price}
                                    {currentTier.unit}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8 flex-1">
                        <div className="flex gap-5">
                            <div
                                className={`size-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 ${step === 1 ? 'bg-white text-blue-600 border-white shadow-lg shadow-white/20' : step > 1 ? 'bg-green-400 text-white border-green-400' : 'border-white/20 text-white/20'}`}
                            >
                                {step > 1 ? <CheckCircle2 className="size-5" /> : '1'}
                            </div>
                            <div>
                                <p
                                    className={`font-bold text-base ${step < 1 ? 'text-white/40' : ''} text-slate-50`}
                                >
                                    Account Details
                                </p>
                                <p className="text-sm text-white/60">Operator information</p>
                            </div>
                        </div>

                        <div className="flex gap-5">
                            <div
                                className={`size-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 ${step === 2 ? 'bg-white text-blue-600 border-white shadow-lg shadow-white/20' : step > 2 ? 'bg-green-400 text-white border-green-400' : 'border-white/20 text-white/20'}`}
                            >
                                {step > 2 ? <CheckCircle2 className="size-5" /> : '2'}
                            </div>
                            <div>
                                <p
                                    className={`font-bold text-base ${step < 2 ? 'text-white/40' : ''} text-slate-50`}
                                >
                                    Verify Email
                                </p>
                                <p className="text-sm text-white/60">Confirm your email address</p>
                            </div>
                        </div>

                        {activeRole === 'operator' && (
                            <>
                                <div className="flex gap-5">
                                    <div
                                        className={`size-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 ${step === 3 ? 'bg-white text-blue-600 border-white shadow-lg shadow-white/20' : step > 3 ? 'bg-green-400 text-white border-green-400' : 'border-white/20 text-white/20'}`}
                                    >
                                        {step > 3 ? <CheckCircle2 className="size-5" /> : '3'}
                                    </div>
                                    <div>
                                        <p
                                            className={`font-bold text-base ${step < 3 ? 'text-white/40' : ''} text-slate-50`}
                                        >
                                            Choose Plan
                                        </p>
                                        <p className="text-sm text-white/60">Select service tier</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-auto pt-8 border-t border-white/10">
                        <p className="text-xs text-white/40 leading-relaxed font-medium">
                            © 2026 VertiAccess. Professional ground access coordination for drone
                            operations.
                        </p>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex-1 p-10 lg:p-20 bg-white">
                    <div className="max-w-[500px] mx-auto">
                        <div className="mb-12">
                            <h1 className="text-3xl font-bold mb-3 text-slate-900">
                                {step === 1
                                    ? 'Create Account'
                                    : step === 2
                                      ? 'Verify Your Email'
                                      : step === 3
                                        ? 'Select your plan'
                                        : 'Secure Payment Details'}
                            </h1>
                            <p className="text-base text-slate-500 leading-relaxed">
                                {step === 1
                                    ? `Enter your details to register as a ${activeRole === 'operator' ? 'drone operator' : 'landowner'}.`
                                    : step === 2
                                      ? 'Enter the 6-digit code sent to your email to verify your account.'
                                      : step === 3
                                        ? 'Choose the tier that best fits your operational needs.'
                                        : 'Add your card details to activate your subscription.'}
                            </p>
                        </div>

                        <form onSubmit={handleNext} className="space-y-6">
                            {step === 1 ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <User className="size-4 text-slate-400" />
                                            Full Name
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full h-14 px-5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all bg-slate-50 text-base"
                                            placeholder="e.g. Alex Thompson"
                                            value={formData.fullName}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    fullName: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-900">
                                                Email Address
                                            </label>
                                            <input
                                                required
                                                type="email"
                                                className="w-full h-14 px-5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all bg-slate-50 text-base"
                                                placeholder="you@example.com"
                                                value={formData.email}
                                                onChange={e =>
                                                    setFormData({
                                                        ...formData,
                                                        email: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-900">
                                                Password
                                            </label>
                                            <input
                                                required
                                                type="password"
                                                className="w-full h-14 px-5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all bg-slate-50 text-base"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={e =>
                                                    setFormData({
                                                        ...formData,
                                                        password: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <Building2 className="size-4 text-slate-400" />
                                            Organisation
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full h-14 px-5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all bg-slate-50 text-base"
                                            placeholder="Company or Department name"
                                            value={formData.organisation}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    organisation: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    {activeRole === 'operator' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                    <Ticket className="size-4 text-slate-400" />
                                                    Flyer ID (CAA)
                                                </label>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full h-14 px-5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all bg-slate-50 text-base uppercase font-mono"
                                                    placeholder="G-XXXX-XXXX"
                                                    value={formData.flyerId}
                                                    onChange={e =>
                                                        setFormData({
                                                            ...formData,
                                                            flyerId: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                    <ShieldCheck className="size-4 text-slate-400" />
                                                    Operator ID (CAA)
                                                </label>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full h-14 px-5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all bg-slate-50 text-base uppercase font-mono"
                                                    placeholder="OP-XXXXXXX"
                                                    value={formData.operatorId}
                                                    onChange={e =>
                                                        setFormData({
                                                            ...formData,
                                                            operatorId: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        loading={isSubmitting}
                                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-bold flex items-center justify-center gap-2 group mt-10 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                                    >
                                        Verify Email{' '}
                                        <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </>
                            ) : step === 2 ? (
                                <>
                                    <div className="space-y-6">
                                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                                            <div className="bg-blue-100 p-2 rounded-full mt-0.5">
                                                <Lock className="size-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 mb-1">
                                                    We've sent a code
                                                </h4>
                                                <p className="text-sm text-slate-600">
                                                    Please check <strong>{formData.email}</strong>{' '}
                                                    for your 6-digit verification code.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                Verification Code
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]{6}"
                                                maxLength={6}
                                                className="w-full h-14 px-4 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all bg-slate-50 text-center text-2xl font-mono tracking-[0.5em]"
                                                placeholder="000000"
                                                value={formData.verificationCode}
                                                onChange={e =>
                                                    setFormData({
                                                        ...formData,
                                                        verificationCode: e.target.value
                                                            .replace(/\D/g, '')
                                                            .slice(0, 6),
                                                    })
                                                }
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        loading={isSubmitting}
                                        disabled={formData.verificationCode.length !== 6}
                                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-bold flex items-center justify-center gap-2 group mt-8 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                                    >
                                        Complete Setup{' '}
                                        <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </>
                            ) : step === 3 ? (
                                <div className="space-y-8">
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                        <button
                                            type="button"
                                            onClick={() => setFilter('subscription')}
                                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${filter === 'subscription' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            Subscription
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFilter('payg')}
                                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${filter === 'payg' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            Pay As You Go
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {isLoadingPlans && (
                                            <div className="space-y-4">
                                                {[1, 2, 3].map(idx => (
                                                    <Skeleton
                                                        key={idx}
                                                        className="h-24 w-full rounded-2xl"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {filteredTiers.map(tier => (
                                            <button
                                                key={tier.name}
                                                type="button"
                                                onClick={() => setSelectedPlan(tier)}
                                                className={`w-full p-6 border rounded-2xl text-left transition-all relative group ${
                                                    selectedPlan?.name === tier.name
                                                        ? 'border-blue-600 bg-blue-600/5 ring-2 ring-blue-600/20'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="pr-4">
                                                        <h4 className="font-bold text-slate-900 text-lg mb-1">
                                                            {tier.name}
                                                        </h4>
                                                        <p className="text-sm text-slate-500 leading-relaxed">
                                                            {tier.description}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-xl font-bold text-blue-600">
                                                            {tier.price}
                                                        </span>
                                                        <span className="text-sm text-slate-400 font-medium">
                                                            {tier.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!selectedPlan}
                                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all mt-6 group shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                                    >
                                        Continue to Payment
                                        <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mb-10">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                                                Order Summary
                                            </span>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                Due Today
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-semibold text-slate-900">
                                                {currentTier?.name} Subscription
                                            </span>
                                            <span className="text-2xl font-bold text-slate-900">
                                                {currentTier?.price}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <CreditCard className="size-4 text-slate-400" />
                                            Secure Card Details
                                        </label>
                                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 transition-all focus-within:ring-4 focus-within:ring-blue-600/5 focus-within:border-blue-600">
                                            <CardElement
                                                options={{
                                                    style: {
                                                        base: {
                                                            fontSize: '16px',
                                                            color: '#0f172a',
                                                            '::placeholder': {
                                                                color: '#94a3b8',
                                                            },
                                                            fontFamily: 'Inter, sans-serif',
                                                        },
                                                        invalid: {
                                                            color: '#ef4444',
                                                        },
                                                    },
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <Button
                                            type="submit"
                                            loading={isSubmitting}
                                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-bold flex items-center justify-center gap-2 group transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                                        >
                                            Activate {currentTier?.name}{' '}
                                            <ShieldCheck className="size-5" />
                                        </Button>
                                    </div>

                                    <p className="text-xs text-slate-400 text-center mt-8 leading-relaxed">
                                        By clicking "Activate", you agree to our Terms of Service
                                        and authorise VertiAccess to charge your payment method on a
                                        recurring basis.
                                    </p>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SignupForm(props: SignupFormProps) {
    return (
        <Elements stripe={stripePromise}>
            <SignupFormBase {...props} />
        </Elements>
    );
}
