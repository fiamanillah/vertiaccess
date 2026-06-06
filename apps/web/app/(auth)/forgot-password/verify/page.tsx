'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
                <Image src="/icon.png" alt="Loading..." width={32} height={32} className="animate-pulse object-contain" />
            </div>
        );
    }

    if (!email) return null;

    return (
        <AuthCardLayout
            title="Security Verification"
            subtitle="Please check your email for the 6-digit verification code."
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
