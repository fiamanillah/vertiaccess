'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Command } from 'lucide-react';
import { buttonVariants } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import OTPForm from '@/app/(auth)/AuthComponents/OTPForm';

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
                    <Command className="h-8 w-8 animate-pulse text-primary" />
                    <p className="text-sm text-muted-foreground">Checking verification status...</p>
                </div>
            </div>
        );
    }

    if (!email) return null;

    return (
        <div className="flex h-screen flex-col lg:flex-row overflow-hidden">
            {/* Left Column: Branding (Hidden on mobile) */}
            <div className="relative hidden flex-col bg-muted p-10 text-white lg:flex lg:basis-1/2 h-full">
                <Image
                    src="/images/signup.png"
                    alt="Verification background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                <Link
                    href="/signup"
                    className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'absolute right-4 top-4 z-30 text-white hover:bg-white/20'
                    )}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Change Email
                </Link>

                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Command className="mr-2 h-6 w-6" />
                    VertiAccess
                </div>

                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;Security is our top priority. The two-factor verification ensures
                            that only authorized operators and landowners can access the sensitive
                            airspace data.&rdquo;
                        </p>
                        <footer className="text-sm font-light opacity-80">
                            Sarah Jenkins, Head of Security
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Right Column: OTPForm */}
            <div className="flex flex-1 items-center justify-center p-8 lg:basis-1/2 h-full overflow-y-auto">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
                    <div className="flex flex-col space-y-2 text-center mb-4">
                        <div className="flex justify-center mb-2">
                            <div className="rounded-full bg-primary/10 p-3 ring-8 ring-primary/5">
                                <Command className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Security Check</h1>
                        <p className="text-sm text-muted-foreground max-w-[320px] mx-auto">
                            To ensure your account is secure, please enter the code sent to your
                            email.
                        </p>
                    </div>
                    <OTPForm email={email} />

                    <p className="px-8 text-center text-xs text-muted-foreground">
                        Protected by VertiAccess Secure Auth. If you don&apos;t see the email, check
                        your spam folder.
                    </p>
                </div>
            </div>
        </div>
    );
}
