import '@workspace/ui/styles/globals.css';
import { Geist_Mono, Inter } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@workspace/ui/lib/utils';
import { Toaster } from '@workspace/ui/components/sonner';
import { AuthProvider } from '@/components/providers/auth-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

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
            className={cn('antialiased', fontMono.variable, 'font-sans', inter.variable)}
        >
            <body>
                <ThemeProvider>
                    <AuthProvider>{children}</AuthProvider>
                </ThemeProvider>
                <Toaster />
            </body>
        </html>
    );
}
