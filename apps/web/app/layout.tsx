import '@workspace/ui/styles/globals.css';
import { Geist_Mono } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';

import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@workspace/ui/lib/utils';
import { Toaster } from '@workspace/ui/components/sonner';
import { AuthProvider } from '@/components/providers/auth-provider';

const fontMono = Geist_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
});

export const metadata = {
    title: {
        default: 'VertiAccess',
        template: '%s | VertiAccess',
    },
    description: 'Secure drone site access and management platform.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={cn('antialiased', fontMono.variable, 'font-sans')}
        >
            <body suppressHydrationWarning>
                <NextTopLoader
                    color="var(--primary)"
                    showSpinner={false}
                    height={3}
                    shadow="0 0 10px var(--primary), 0 0 5px var(--primary)"
                />
                <ThemeProvider>
                    <AuthProvider>{children}</AuthProvider>
                </ThemeProvider>
                <Toaster />
            </body>
        </html>
    );
}
