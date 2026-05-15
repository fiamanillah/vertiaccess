'use client';
import * as React from 'react';

import { AccountOverview } from './components/account-overview';
import { VerificationCard } from './components/verification/verification-card';
import { SecuritySettings } from './components/security-settings';
import { DangerZone } from './components/danger-zone';
import { useAuthStore } from '@/store/use-auth-store';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const { user, isLoading } = useAuthStore();

    const accountOverviewData = React.useMemo(() => {
        if (!user) return null;
        return {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            organisation: user.organisation || 'N/A',
            accountType: user.role,
            accountId: user.vaId || 'N/A',
            verificationStatus: user.verificationStatus,
            flyerId: user.flyerId,
            operatorId: user.operatorId,
        };
    }, [user]);

    if (isLoading || !user || !accountOverviewData) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-4 lg:gap-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">
                    Manage your personal settings and account status
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <AccountOverview user={accountOverviewData} />
                <VerificationCard />

                <div className="space-y-8">
                    <SecuritySettings />
                    <DangerZone />
                </div>
            </div>
        </div>
    );
}
