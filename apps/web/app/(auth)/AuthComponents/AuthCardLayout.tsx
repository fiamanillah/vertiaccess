import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Card } from '@workspace/ui/components/card';
import { buttonVariants } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

interface AuthCardLayoutProps {
    title: string;
    subtitle: string;
    quote?: {
        text: string;
        author: string;
    };
    backLink?: {
        href: string;
        label: string;
    };
    children: React.ReactNode;
}

export default function AuthCardLayout({
    title,
    subtitle,
    quote,
    backLink,
    children,
}: AuthCardLayoutProps) {
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-75 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="relative w-full max-w-4xl overflow-hidden rounded-2xl border bg-card/75 backdrop-blur-md shadow-md grid md:grid-cols-12 min-h-0 md:min-h-150 z-10 py-0">
                {/* Left Column: Branding and Context Panel */}
                <div className="hidden md:flex md:col-span-5 relative flex-col justify-between p-8 text-primary-foreground bg-primary border-r border-primary/10 overflow-hidden">
                    {/* Background image styled overlay */}
                    <div className="absolute inset-0 z-0">
                        <Image
                            src="/images/signup.png"
                            alt="VertiAccess Branding"
                            fill
                            className="object-cover opacity-20 mix-blend-overlay"
                            priority
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-primary via-primary/90 to-primary/80" />
                    </div>

                    {/* Top Section: Logo & Back Link in the same line */}
                    <div className="relative z-10 flex items-center justify-between w-full">
                        <div className="flex items-center justify-center">
                            <Image src="/logo.png" alt="VertiAccess Logo" width={140} height={35} className="object-contain" />
                        </div>
                        {backLink && (
                            <Link
                                href={backLink.href}
                                className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors hidden md:inline-flex -mr-2'
                                )}
                            >
                                <ChevronLeft className="mr-1.5 h-4 w-4" />
                                {backLink.label}
                            </Link>
                        )}
                    </div>

                    {/* Marketing Title / Subtitle */}
                    <div className="relative z-10 my-auto py-8">
                        <h2 className="text-2xl font-bold tracking-tight mb-3 text-primary-foreground">
                            {title}
                        </h2>
                        <p className="text-sm text-primary-foreground/80 leading-relaxed">
                            {subtitle}
                        </p>
                    </div>

                    {/* Testimonial / Quote & Copyright Footer */}
                    <div className="relative z-10 mt-auto border-t border-primary-foreground/10 pt-4 space-y-3">
                        {quote && (
                            <div className="space-y-1">
                                <p className="text-xs text-primary-foreground/85 italic leading-relaxed">
                                    &ldquo;{quote.text}&rdquo;
                                </p>
                                <span className="text-[10px] text-primary-foreground/70 font-medium block">
                                    — {quote.author}
                                </span>
                            </div>
                        )}
                        <p className="text-[10px] text-primary-foreground/60 leading-normal">
                            © 2026 VertiAccess. Professional ground access coordination for drone operations.
                        </p>
                    </div>
                </div>

                {/* Right Column: Interactive Form Panel */}
                <div className="col-span-12 md:col-span-7 flex flex-col justify-center p-6 sm:p-8 md:p-10 relative overflow-y-auto max-h-[90vh] md:max-h-187.5 custom-scrollbar">
                    {/* Back link for mobile only */}
                    {backLink && (
                        <Link
                            href={backLink.href}
                            className={cn(
                                buttonVariants({ variant: 'ghost', size: 'sm' }),
                                'absolute right-4 top-4 z-20 text-muted-foreground hover:text-foreground transition-colors md:hidden'
                            )}
                        >
                            <ChevronLeft className="mr-1.5 h-4 w-4" />
                            {backLink.label}
                        </Link>
                    )}

                    <div className="w-full">
                        {children}
                    </div>
                </div>
            </Card>
        </div>
    );
}
