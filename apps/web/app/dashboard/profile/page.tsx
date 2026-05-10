import { AccountOverview } from './components/account-overview';
import { VerificationCard } from './components/verification/verification-card';
import { SecuritySettings } from './components/security-settings';
import { DangerZone } from './components/danger-zone';

export default function ProfilePage() {
    const user = {
        name: 'Fi Amanillah Bitu',
        email: 'mdbitu35+2@gmail.com',
        organisation: 'Other',
        accountType: 'landowner',
        accountId: 'vt-lo-5ddc10',
    };

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
                <AccountOverview user={user} />
                <VerificationCard />

                <div className="space-y-8">
                    <SecuritySettings />
                    <DangerZone />
                </div>
            </div>
        </div>
    );
}
