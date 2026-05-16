'use client';

import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const { user, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/login');
                return;
            }

            switch (user.role?.toLowerCase()) {
                case 'admin':
                    router.replace('/dashboard/admin');
                    break;
                case 'operator':
                    router.replace('/dashboard/operator');
                    break;
                case 'landowner':
                default:
                    router.replace('/dashboard/landowner');
                    break;
            }
        }
    }, [user, isLoading, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                <Loader2 className="h-10 w-10 text-primary animate-spin relative" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm font-semibold tracking-tight">Verifying your role</p>
                <p className="text-xs text-muted-foreground">Preparing your dashboard...</p>
            </div>
        </div>
    );
}
