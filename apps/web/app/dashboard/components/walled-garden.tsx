'use client';

import * as React from 'react';
import { useAuthStore } from '@/store/use-auth-store';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Textarea } from '@workspace/ui/components/textarea';
import { AlertTriangle, Lock, Ban, LogOut, ArrowRight, Loader2 } from 'lucide-react';
import { appealService } from '@/services/appeal.service';
import { toast } from 'sonner';
import type { User } from '@/services/auth/types';

interface WalledGardenProps {
    user: User;
}

export function WalledGarden({ user }: WalledGardenProps) {
    const { logout } = useAuthStore();
    
    // State B: Appeal Form state
    const [isAppealing, setIsAppealing] = React.useState(false);
    const [appealReason, setAppealReason] = React.useState('');
    const [isSubmittingAppeal, setIsSubmittingAppeal] = React.useState(false);
    const [appealSubmitted, setAppealSubmitted] = React.useState(false);

    // Determine state
    const isStateA = user.paymentLocked || user.verificationStatus === 'PAYMENT_LOCKED';
    const isStateB = user.verificationStatus === 'SUSPENDED' && !isStateA;
    const isStateC = user.verificationStatus === 'BANNED';

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const handleSubmitAppeal = async () => {
        if (!appealReason.trim()) {
            toast.error('Please provide a reason for your appeal.');
            return;
        }

        setIsSubmittingAppeal(true);
        try {
            const res = await appealService.submitAppeal({ reason: appealReason });
            if (res.success) {
                setAppealSubmitted(true);
                toast.success('Your appeal has been securely submitted.');
            } else {
                toast.error(res.message || 'Failed to submit appeal.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit appeal.');
        } finally {
            setIsSubmittingAppeal(false);
        }
    };

    // --- RENDER STATE A: PAYMENT LOCK ---
    if (isStateA) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
                <Card className="w-full max-w-md shadow-2xl border-orange-500/20 ring-1 ring-orange-500/10">
                    <CardHeader className="text-center space-y-4 pb-6">
                        <div className="mx-auto h-16 w-16 bg-orange-500/10 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-8 w-8 text-orange-500" strokeWidth={2.5} />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                            Account Locked: Payment Overdue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {user.paymentLockedReason || 'Your recent emergency landing incurred a fee, but your default payment method declined. Your access to VertiAccess has been temporarily suspended.'}
                        </p>
                        {user.overdueBookingDetails && (
                            <div className="bg-muted/50 rounded-lg p-4 border border-border text-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-muted-foreground">Booking Ref:</span>
                                    <span className="font-semibold">{(user.overdueBookingDetails.bookingReference || '').toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Amount Due:</span>
                                    <span className="font-bold text-orange-500">
                                        £{Number(user.overdueBookingDetails.amountDue).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-4">
                        <Button className="w-full font-bold bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                            Update Payment Method <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={handleLogout}>
                            Log out for now
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // --- RENDER STATE B: SUSPENDED ---
    if (isStateB) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
                <Card className="w-full max-w-lg shadow-2xl border-red-500/20 ring-1 ring-red-500/10">
                    <CardHeader className="text-center space-y-4 pb-6">
                        <div className="mx-auto h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center">
                            <Lock className="h-8 w-8 text-red-500" strokeWidth={2.5} />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                            Account Suspended
                        </CardTitle>
                    </CardHeader>
                    
                    {!appealSubmitted ? (
                        <>
                            <CardContent className="space-y-6">
                                <div className="text-center space-y-4">
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Your account has been suspended pending investigation. During this time, access to the platform and your active certificates is restricted.
                                    </p>
                                    <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/20 text-sm text-left">
                                        <p className="font-semibold text-red-500 mb-1 uppercase text-xs tracking-wider">Reason for Suspension</p>
                                        <p className="font-medium text-foreground">
                                            {user.suspendedReason || 'Administrative suspension pending review of a recent incident report.'}
                                        </p>
                                    </div>
                                </div>

                                {isAppealing && (
                                    <div className="space-y-3 pt-4 border-t border-border animate-in fade-in zoom-in-95 duration-200">
                                        <label className="text-sm font-semibold">Appeal Statement</label>
                                        <Textarea 
                                            placeholder="Please provide details and context for your appeal. This will be sent directly to the Admin Resolution Center."
                                            className="min-h-[120px] resize-none"
                                            value={appealReason}
                                            onChange={(e) => setAppealReason(e.target.value)}
                                            disabled={isSubmittingAppeal}
                                        />
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3 pt-4 bg-muted/20 border-t border-border/40">
                                {!isAppealing ? (
                                    <Button 
                                        className="w-full font-bold" 
                                        size="lg"
                                        onClick={() => setIsAppealing(true)}
                                    >
                                        File an Appeal
                                    </Button>
                                ) : (
                                    <div className="w-full flex gap-3">
                                        <Button 
                                            variant="outline" 
                                            className="flex-1"
                                            onClick={() => {
                                                setIsAppealing(false);
                                                setAppealReason('');
                                            }}
                                            disabled={isSubmittingAppeal}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            className="flex-1 font-bold" 
                                            onClick={handleSubmitAppeal}
                                            disabled={isSubmittingAppeal}
                                        >
                                            {isSubmittingAppeal ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting</>
                                            ) : (
                                                'Submit Appeal'
                                            )}
                                        </Button>
                                    </div>
                                )}
                                <Button variant="ghost" className="w-full text-muted-foreground text-xs mt-2" onClick={handleLogout}>
                                    Log out
                                </Button>
                            </CardFooter>
                        </>
                    ) : (
                        // Appeal Submitted Success State
                        <CardContent className="text-center space-y-6 pb-8">
                            <div className="bg-emerald-500/10 text-emerald-600 rounded-lg p-6 border border-emerald-500/20">
                                <h3 className="font-bold text-lg mb-2">Appeal Submitted</h3>
                                <p className="text-sm opacity-90">
                                    Your appeal has been received. Our administrative team will review your case and contact you via email with an update.
                                </p>
                            </div>
                            <Button variant="outline" className="w-full" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                            </Button>
                        </CardContent>
                    )}
                </Card>
            </div>
        );
    }

    // --- RENDER STATE C: PERMANENT BAN ---
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-md shadow-2xl border-zinc-800/20 ring-1 ring-zinc-800/10">
                <CardHeader className="text-center space-y-4 pb-6">
                    <div className="mx-auto h-16 w-16 bg-zinc-800/10 rounded-full flex items-center justify-center">
                        <Ban className="h-8 w-8 text-zinc-800 dark:text-zinc-400" strokeWidth={2.5} />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Account Permanently Closed
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        After a thorough review, your account has been permanently disabled for violating the VertiAccess Terms of Service.
                    </p>
                    <div className="bg-zinc-500/5 rounded-lg p-4 border border-zinc-500/20 text-sm text-left">
                        <p className="font-semibold text-zinc-600 dark:text-zinc-400 mb-1 uppercase text-xs tracking-wider">Final Decision Notice</p>
                        <p className="font-medium text-foreground">
                            {user.suspendedReason || 'This decision is final and no further appeals will be considered.'}
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-4">
                    <Button className="w-full font-bold bg-zinc-900 hover:bg-zinc-800 text-white" size="lg" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                    </Button>
                    <a href="#" className="text-xs text-muted-foreground hover:underline mt-2 inline-block">
                        Review Terms of Service
                    </a>
                </CardFooter>
            </Card>
        </div>
    );
}
