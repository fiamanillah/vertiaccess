'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import OTPForm from '@/app/(auth)/AuthComponents/OTPForm';
import AuthCardLayout from '@/app/(auth)/AuthComponents/AuthCardLayout';

export default function VerifyOTP() {
    const router = useRouter();
    const [email, setEmail] = React.useState<string | null>(null);
    const [isChecking, setIsChecking] = React.useState(true);

    React.useEffect(() => {
        // Handle context check
        const storedEmail = sessionStorage.getItem('pending_verification_email');

        if (!storedEmail) {
            // No context found, redirect to signup
            router.replace('/signup');
        } else {
            setEmail(storedEmail);
            setIsChecking(false);
        }
    }, [router]);

    if (isChecking) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Image src="/icon.png" alt="Loading..." width={32} height={32} className="animate-pulse object-contain" />
                    <p className="text-sm text-muted-foreground">Checking verification status...</p>
                </div>
            </div>
        );
    }

    if (!email) return null;

    return (
        <AuthCardLayout
            title="Security Check"
            subtitle="To ensure your account is secure, please enter the code sent to your email."
            backLink={{
                href: '/signup',
                label: 'Change Email',
            }}
        >
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                <OTPForm email={email} />
            </div>
        </AuthCardLayout>
    );
}
