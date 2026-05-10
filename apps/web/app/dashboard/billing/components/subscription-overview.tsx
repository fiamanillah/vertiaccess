'use client';

import * as React from 'react';
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
import { Rocket, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
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
import { toast } from 'sonner';

export function SubscriptionOverview() {
    const [isUpgradeOpen, setIsUpgradeOpen] = React.useState(false);
    const [isCancelOpen, setIsCancelOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleUpgrade = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsUpgradeOpen(false);
            toast.success('Subscription upgraded successfully!');
        }, 1500);
    };

    const handleCancel = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsCancelOpen(false);
            toast.success('Subscription cancelled. You will have access until the end of your billing period.');
        }, 1500);
    };

    return (
        <>
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Current Plan Card */}
                <Card className="relative overflow-hidden border-primary/20 shadow-lg shadow-primary/5 flex flex-col justify-between">
                    {/* Background accent */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 z-0 pointer-events-none" />
                    
                    <CardHeader className="relative z-10 pb-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                    Pro Plan
                                    <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 border-none">Active</Badge>
                                </CardTitle>
                                <CardDescription>Your current subscription tier</CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black tracking-tight">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-6">
                        <ul className="space-y-2 text-sm text-muted-foreground font-medium">
                            <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-primary" /> Up to 10,000 API Requests</li>
                            <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-primary" /> 5 GB Storage</li>
                            <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-primary" /> Priority Support</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="relative z-10 flex flex-col sm:flex-row gap-3 pt-4 border-t bg-muted/30">
                        <Button 
                            className="w-full sm:w-auto flex-1 gap-2 shadow-md font-semibold" 
                            onClick={() => setIsUpgradeOpen(true)}
                        >
                            <Zap size={16} className="fill-current" /> Upgrade to Enterprise
                        </Button>
                        <Button 
                            variant="outline" 
                            className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 font-semibold"
                            onClick={() => setIsCancelOpen(true)}
                        >
                            Cancel Plan
                        </Button>
                    </CardFooter>
                </Card>

                {/* Usage Summary Card */}
                <Card className="flex flex-col">
                    <CardHeader className="pb-6">
                        <CardTitle className="text-lg">Usage Summary</CardTitle>
                        <CardDescription>Your current billing cycle usage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 flex-1">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm items-end">
                                <div>
                                    <p className="font-semibold text-foreground">API Requests</p>
                                    <p className="text-xs text-muted-foreground">Resets in 12 days</p>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-foreground">8,500</span>
                                    <span className="text-muted-foreground"> / 10,000</span>
                                </div>
                            </div>
                            <Progress value={85} className="h-2.5 bg-muted [&>div]:bg-primary" />
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm items-end">
                                <div>
                                    <p className="font-semibold text-foreground">Storage Used</p>
                                    <p className="text-xs text-muted-foreground">Included in plan</p>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-foreground">2.0 GB</span>
                                    <span className="text-muted-foreground"> / 5.0 GB</span>
                                </div>
                            </div>
                            <Progress value={40} className="h-2.5 bg-muted [&>div]:bg-emerald-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upgrade Confirmation Modal */}
            <AlertDialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl">
                            <Rocket className="text-primary fill-primary/20" size={24} />
                            Upgrade to Enterprise
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            You are about to upgrade to the Enterprise plan for <strong>$99/mo</strong>. This will immediately grant you access to unlimited API requests, 50GB of storage, and dedicated 24/7 support.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <Button onClick={handleUpgrade} disabled={isLoading} className="gap-2 min-w-[140px]">
                            {isLoading ? 'Processing...' : 'Confirm Upgrade'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Confirmation Modal */}
            <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                <AlertDialogContent className="border-destructive/20">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive flex items-center gap-2 text-xl">
                            <AlertTriangle size={24} />
                            Cancel Subscription
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-muted-foreground">
                            Are you absolutely sure you want to cancel your Pro Plan? You will lose access to premium features at the end of your current billing cycle on <strong>August 3, 2025</strong>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={isLoading}>Keep My Plan</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleCancel} disabled={isLoading} className="min-w-[140px]">
                            {isLoading ? 'Cancelling...' : 'Yes, Cancel Plan'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
