'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@workspace/ui/components/card';
import { Progress } from '@workspace/ui/components/progress';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { AlertTriangle, Zap, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { toast } from 'sonner';
import { subscriptionService, type UserSubscriptionStatus } from '@/services/subscription.service';

export function SubscriptionOverview() {
    const router = useRouter();
    const [subscription, setSubscription] = React.useState<UserSubscriptionStatus | null>(null);
    const [isCancelOpen, setIsCancelOpen] = React.useState(false);
    const [isLoadingData, setIsLoadingData] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(false);

    const fetchSubscription = async () => {
        try {
            const res = await subscriptionService.getSubscriptionStatus();
            if (res.success) {
                setSubscription(res.data);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to fetch subscription status');
        } finally {
            setIsLoadingData(false);
        }
    };

    React.useEffect(() => {
        fetchSubscription();
    }, []);

    const handleCancel = async () => {
        setIsLoading(true);
        try {
            const res = await subscriptionService.cancelSubscription();
            if (res.success) {
                toast.success('Subscription cancelled successfully.');
                fetchSubscription();
            } else {
                toast.error(res.message || 'Failed to cancel subscription.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel subscription.');
        } finally {
            setIsLoading(false);
            setIsCancelOpen(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 w-full">
                <Card className="flex flex-col justify-between p-6 space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                </Card>
                <Card className="p-6 space-y-6">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </Card>
            </div>
        );
    }

    const isPayg = subscription?.billingType === 'payg';
    const hasActiveSub = subscription?.hasActiveSubscription;
    const isCancelled = subscription?.cancelAtPeriodEnd;
    const planName = subscription?.planName || 'Pay As You Go';
    const price = subscription?.price ?? 0;
    const currency = subscription?.currency || 'GBP';

    const getCurrencySymbol = (cur: string) => {
        switch (cur.toUpperCase()) {
            case 'USD': return '$';
            case 'EUR': return '€';
            default: return '£';
        }
    };

    return (
        <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 w-full">
                {/* Current Plan Card */}
                <Card className="relative overflow-hidden border-primary/20 shadow-lg shadow-primary/5 flex flex-col justify-between">
                    {/* Background accent */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 z-0 pointer-events-none" />

                    <CardHeader className="relative z-10 pb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 flex-wrap">
                                    {planName}
                                    <Badge 
                                        variant={isCancelled ? "secondary" : "default"} 
                                        className={isCancelled ? "" : "bg-primary/20 text-primary hover:bg-primary/30 border-none"}
                                    >
                                        {isCancelled ? "Cancelled" : "Active"}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    {isPayg 
                                        ? "Your default transactional booking plan" 
                                        : "Your subscription billing plan"}
                                </CardDescription>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                                <div className="text-3xl sm:text-4xl font-black tracking-tight">
                                    {getCurrencySymbol(currency)}{price.toFixed(2)}
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {isPayg ? '/booking' : '/mo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-6">
                        <ul className="space-y-2 text-sm text-muted-foreground font-medium">
                            {isPayg ? (
                                <>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                                        <span>No Monthly Recurring Commitments</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                                        <span>Standard Booking Platform Fees</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                                        <span>Access to all active landing sites</span>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                                        <span>Discounted booking fees</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                                        <span>Priority Support and Fast Verification Routing</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                                        <span>Advanced analytics on booking history</span>
                                    </li>
                                </>
                            )}
                            {subscription?.currentPeriodEnd && (
                                <li className="flex items-center gap-2 pt-2 border-t text-xs font-semibold text-muted-foreground">
                                    <Calendar size={14} />
                                    <span>
                                        {isCancelled ? 'Expires on: ' : 'Next billing date: '}
                                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                    </span>
                                </li>
                            )}
                        </ul>
                    </CardContent>
                    <CardFooter className="relative z-10 flex flex-col sm:flex-row gap-3 pt-4 border-t bg-muted/30">
                        <Button
                            className="w-full sm:w-auto sm:flex-1 gap-2 shadow-md font-semibold"
                            size={"lg"}
                            onClick={() => router.push('/dashboard/operator/billing/subscription')}
                        >
                            <Zap size={16} className="fill-current" /> 
                            {isPayg ? 'Upgrade to Pro Plan' : 'Change Plan'}
                        </Button>
                        {!isPayg && !isCancelled && (
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 font-semibold"
                                onClick={() => setIsCancelOpen(true)}
                            >
                                Cancel Plan
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {/* Usage Summary Card */}
                <Card className="flex flex-col">
                    <CardHeader className="pb-6">
                        <CardTitle className="text-lg">Platform Usage</CardTitle>
                        <CardDescription>Your current operator booking activity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 flex-1">
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1">
                                <div>
                                    <p className="font-semibold text-foreground">Completed Bookings</p>
                                    <p className="text-xs text-muted-foreground">This month</p>
                                </div>
                                <div className="text-left sm:text-right shrink-0">
                                    <span className="font-bold text-foreground text-sm sm:text-base">12</span>
                                    <span className="text-muted-foreground text-xs sm:text-sm"> / Unlimited</span>
                                </div>
                            </div>
                            <Progress value={12} className="h-2 sm:h-2.5 bg-muted [&>div]:bg-primary" />
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1">
                                <div>
                                    <p className="font-semibold text-foreground">Active Flight Requests</p>
                                    <p className="text-xs text-muted-foreground">Currently pending review</p>
                                </div>
                                <div className="text-left sm:text-right shrink-0">
                                    <span className="font-bold text-foreground text-sm sm:text-base">2</span>
                                </div>
                            </div>
                            <Progress value={20} className="h-2 sm:h-2.5 bg-muted [&>div]:bg-emerald-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cancel Confirmation Modal */}
            <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                <AlertDialogContent className="border-destructive/20">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive flex items-center gap-2 text-xl">
                            <AlertTriangle size={24} />
                            Cancel Subscription
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-muted-foreground">
                            Are you absolutely sure you want to cancel your {planName} plan? You will lose access to premium booking rates at the end of your current billing cycle{subscription?.currentPeriodEnd && <span> on <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong></span>}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={isLoading}>Keep My Plan</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleCancel} disabled={isLoading} className="min-w-[140px]">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                'Yes, Cancel Plan'
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
