import SignUpForm from '@/app/(auth)/AuthComponents/SignUpForm';
import { ChevronLeft, Command, Landmark, Plane } from 'lucide-react';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

export default function SignUp() {
    return (
        <div className="flex h-screen flex-col lg:flex-row overflow-hidden">
            {/* Left Column: Branding (Hidden on mobile) */}
            <div className="relative hidden flex-col bg-muted p-10 text-white lg:flex lg:basis-1/2 h-full">
                <Image
                    src="/images/signup.png"
                    alt="Signup background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                <Link
                    href="/"
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
                            &ldquo;This platform has completely transformed how we handle our drone
                            operations and land access. The speed and security are unmatched.&rdquo;
                        </p>
                        <footer className="text-sm font-light opacity-80">
                            Sofia Davis, CTO at TechFlow
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Right Column: SignUp Form */}
            <div className="flex flex-1 items-start justify-center p-8 lg:basis-1/2 h-full overflow-y-auto pt-16 lg:pt-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
                    <div className="flex flex-col space-y-2 text-center mb-4">
                        <div className="flex justify-center mb-2">
                            <div className="rounded-full bg-primary/10 p-3 ring-8 ring-primary/5">
                                <Command className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">VertiAccess</h1>
                        <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                            Join the leading platform for secure drone operations and professional
                            land access management.
                        </p>
                    </div>

                    <Tabs defaultValue="landowner" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="landowner" className="gap-2">
                                <Landmark className="h-4 w-4" />
                                Landowner
                            </TabsTrigger>
                            <TabsTrigger value="operator" className="gap-2">
                                <Plane className="h-4 w-4" />
                                Drone Operator
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="landowner">
                            <SignUpForm role="landowner" />
                        </TabsContent>
                        <TabsContent value="operator">
                            <SignUpForm role="operator" />
                        </TabsContent>
                    </Tabs>

                    <p className="px-8 text-center text-xs text-muted-foreground">
                        By clicking continue, you agree to our{' '}
                        <a
                            href="/terms"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a
                            href="/privacy"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Privacy Policy
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
