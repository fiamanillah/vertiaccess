'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'lucide-react';
import ForgotPasswordOTPForm from '@/app/(auth)/AuthComponents/ForgotPasswordOTPForm';
import AuthCardLayout from '@/app/(auth)/AuthComponents/AuthCardLayout';

export default function ForgotPasswordVerify() {
    const router = useRouter();
    const [email, setEmail] = React.useState<string | null>(null);
    const [isChecking, setIsChecking] = React.useState(true);

    React.useEffect(() => {
        const storedEmail = sessionStorage.getItem('forgot_password_email');
        if (!storedEmail) {
            router.replace('/forgot-password');
        } else {
            setEmail(storedEmail);
            setIsChecking(false);
        }
    }, [router]);

    if (isChecking) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Command className="h-8 w-8 animate-pulse text-primary" />
            </div>
        );
    }

    if (!email) return null;

    return (
        <AuthCardLayout
            title="Security Verification"
            subtitle="Please check your email for the 6-digit verification code."
            quote={{
                text: "We take every recovery request seriously. Your identity verification is the first step in reclaiming your secure workspace.",
                author: "Alex Rivera, Platform Integrity",
            }}
            backLink={{
                href: '/forgot-password',
                label: 'Back',
            }}
        >
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                <ForgotPasswordOTPForm email={email} />
            </div>
        </AuthCardLayout>
    );
}
