'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ResetPasswordForm from '@/app/(auth)/AuthComponents/ResetPasswordForm';
import AuthCardLayout from '@/app/(auth)/AuthComponents/AuthCardLayout';

export default function ForgotPasswordReset() {
    const router = useRouter();
    const [isChecking, setIsChecking] = React.useState(true);

    React.useEffect(() => {
        const email = sessionStorage.getItem('forgot_password_email');
        const verified = sessionStorage.getItem('forgot_password_verified');

        if (!email || verified !== 'true') {
            router.replace('/forgot-password');
        } else {
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

    return (
        <AuthCardLayout
            title="Secure Account"
            subtitle="Create a new, strong password to complete the recovery."
        >
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                <ResetPasswordForm />
            </div>
        </AuthCardLayout>
    );
}
