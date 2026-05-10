'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Command } from 'lucide-react';
import { buttonVariants } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import ForgotPasswordOTPForm from '@/app/(auth)/AuthComponents/ForgotPasswordOTPForm';

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
        <div className="flex h-screen flex-col lg:flex-row overflow-hidden">
            <div className="relative hidden flex-col bg-muted p-10 text-white lg:flex lg:basis-1/2 h-full">
                <Image
                    src="/images/signup.png"
                    alt="Verify background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                <Link
                    href="/forgot-password"
                    className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'absolute right-4 top-4 z-30 text-white hover:bg-white/20'
                    )}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                </Link>
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Command className="mr-2 h-6 w-6" />
                    VertiAccess
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;We take every recovery request seriously. Your identity
                            verification is the first step in reclaiming your secure
                            workspace.&rdquo;
                        </p>
                        <footer className="text-sm font-light opacity-80">
                            Alex Rivera, Platform Integrity
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
                        <h1 className="text-3xl font-bold tracking-tight">Security Code</h1>
                        <p className="text-sm text-muted-foreground max-w-[320px] mx-auto">
                            Check your inbox for the 6-digit verification code.
                        </p>
                    </div>

                    <ForgotPasswordOTPForm email={email} />
                </div>
            </div>
        </div>
    );
}
