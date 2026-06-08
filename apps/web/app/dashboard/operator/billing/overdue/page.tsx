'use client'

import * as React from 'react'
import { Button } from '@workspace/ui/components/button'
import { AlertTriangle, CreditCard, Loader2, ArrowRight, Phone, CheckCircle2 } from 'lucide-react'
import { paymentService } from '@/services/payments/payment.service'
import { useAuthStore } from '@/store/use-auth-store'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Hard-stop page shown when the operator's account is PAYMENT_LOCKED.
 * Displays the overdue booking details and a retry flow.
 */
export default function OverdueBillingPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [isRetrying, setIsRetrying] = React.useState(false)
    const [isResolved, setIsResolved] = React.useState(false)

    const details = user?.overdueBookingDetails ?? null
    const amountDue = details?.amountDue ?? 150
    const siteName = details?.siteName ?? 'your site'
    const bookingRef = details?.bookingReference ? details.bookingReference.toUpperCase() : '—'
    const cardLast4 = details?.cardLast4 ?? null

    const handleRetryPayment = async () => {
        setIsRetrying(true)
        try {
            await paymentService.retryOverduePayment()
            setIsResolved(true)
            toast.success('Payment successful! Your account has been restored.')
            // Brief delay then redirect to dashboard
            setTimeout(() => router.push('/dashboard/operator'), 2000)
        } catch (err: any) {
            toast.error(err?.message ?? 'Payment failed. Please ensure your card has funds and try again.')
        } finally {
            setIsRetrying(false)
        }
    }

    if (isResolved) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">Account Restored</h1>
                    <p className="text-muted-foreground text-sm">
                        Your payment was successful. Redirecting to your dashboard…
                    </p>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-lg space-y-6">
                {/* Alert header */}
                <div className="flex flex-col items-center text-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-destructive">
                            Account Suspended
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            Your account has been suspended due to an outstanding emergency landing payment.
                            Resolve your balance to restore access.
                        </p>
                    </div>
                </div>

                {/* Overdue booking details */}
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-destructive/80">
                        Outstanding Balance
                    </p>
                    <div className="flex items-end justify-between">
                        <div className="space-y-1">
                            <p className="text-3xl font-black text-destructive">
                                £{amountDue.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Emergency landing fee for <strong>{siteName}</strong>
                            </p>
                        </div>
                        <div className="text-right space-y-0.5">
                            <p className="text-[10px] text-muted-foreground font-mono uppercase">
                                Booking
                            </p>
                            <p className="text-xs font-mono font-bold">{bookingRef}</p>
                        </div>
                    </div>

                    {cardLast4 && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                            <div className="bg-muted p-2 rounded-lg">
                                <CreditCard className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                    Failed Card
                                </p>
                                <p className="text-xs font-bold font-mono">•••• {cardLast4}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Resolution options */}
                <div className="space-y-3">
                    <Button
                        className="w-full font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                        onClick={handleRetryPayment}
                        disabled={isRetrying}
                    >
                        {isRetrying ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Processing Payment…
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Retry Payment — £{amountDue.toFixed(2)}
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                        )}
                    </Button>

                    <p className="text-center text-[10px] text-muted-foreground font-medium">
                        Your card will be charged £{amountDue.toFixed(2)} and your account will be
                        immediately restored.
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            Or
                        </span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <Button
                        variant="outline"
                        className="w-full font-black uppercase tracking-widest"
                        onClick={() => window.open('mailto:support@vertiaccess.com', '_blank')}
                    >
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Support
                    </Button>
                </div>

                <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
                    Need to update your card first? Contact support and we'll help you update your
                    payment method before retrying.
                </p>
            </div>
        </div>
    )
}
