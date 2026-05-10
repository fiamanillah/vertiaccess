'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Command } from 'lucide-react';
import ResetPasswordForm from '@/app/(auth)/AuthComponents/ResetPasswordForm';

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
                <Command className="h-8 w-8 animate-pulse text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col lg:flex-row overflow-hidden">
            <div className="relative hidden flex-col bg-muted p-10 text-white lg:flex lg:basis-1/2 h-full">
                <Image
                    src="/images/signup.png"
                    alt="Reset background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Command className="mr-2 h-6 w-6" />
                    VertiAccess
                </div>

                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;A strong password is your first line of defense. Use a
                            combination of characters that is unique to this service.&rdquo;
                        </p>
                        <footer className="text-sm font-light opacity-80">
                            System Security Notice
                        </footer>
                    </blockquote>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center p-8 lg:basis-1/2 h-full overflow-y-auto">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
                    <div className="flex flex-col space-y-2 text-center mb-4">
                        <div className="flex justify-center mb-2">
                            <div className="rounded-full bg-primary/10 p-3 ring-8 ring-primary/5">
                                <Command className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">New Password</h1>
                        <p className="text-sm text-muted-foreground max-w-[320px] mx-auto">
                            Your identity has been verified. You can now set your new password.
                        </p>
                    </div>

                    <ResetPasswordForm />
                </div>
            </div>
        </div>
    );
}
