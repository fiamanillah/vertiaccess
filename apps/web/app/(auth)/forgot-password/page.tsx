import ForgotPasswordForm from '@/app/(auth)/AuthComponents/ForgotPasswordForm';
import { ChevronLeft, Command } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

export default function ForgotPassword() {
    return (
        <div className="flex h-screen flex-col lg:flex-row overflow-hidden">
            {/* Left Column: Branding (Hidden on mobile) */}
            <div className="relative hidden flex-col bg-muted p-10 text-white lg:flex lg:basis-1/2 h-full">
                <Image
                    src="/images/signup.png"
                    alt="Reset password background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                <Link
                    href="/login"
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
                            &ldquo;Our account recovery system is designed with multi-layered
                            security to ensure your data remains protected even when you lose
                            access.&rdquo;
                        </p>
                        <footer className="text-sm font-light opacity-80">
                            David Chen, Security Architect
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Right Column: ForgotPasswordForm */}
            <div className="flex flex-1 items-center justify-center p-8 lg:basis-1/2 h-full overflow-y-auto">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
                    <div className="flex flex-col space-y-2 text-center mb-4">
                        <div className="flex justify-center mb-2">
                            <div className="rounded-full bg-primary/10 p-3 ring-8 ring-primary/5">
                                <Command className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Recovery</h1>
                        <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                            Don&apos;t worry, it happens to the best of us. Let&apos;s get you back
                            in.
                        </p>
                    </div>

                    <ForgotPasswordForm />
                </div>
            </div>
        </div>
    );
}
