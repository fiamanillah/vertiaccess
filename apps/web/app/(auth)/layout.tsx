"use client";

import '@workspace/ui/styles/globals.css';
import { useEffect } from 'react';

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    useEffect(() => {
        const html = document.documentElement;
        
        // Save initial theme states
        const hadDark = html.classList.contains('dark');
        const hadLight = html.classList.contains('light');

        // Force light mode classes
        html.classList.remove('dark');
        html.classList.add('light');
        html.style.colorScheme = 'light';

        // Set up MutationObserver to prevent other components (like next-themes ThemeProvider)
        // from re-applying the 'dark' class while on auth pages.
        const observer = new MutationObserver(() => {
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
            }
            if (!html.classList.contains('light')) {
                html.classList.add('light');
            }
            if (html.style.colorScheme !== 'light') {
                html.style.colorScheme = 'light';
            }
        });

        observer.observe(html, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });

        return () => {
            observer.disconnect();
            html.classList.remove('light');
            if (hadDark) {
                html.classList.add('dark');
                html.style.colorScheme = 'dark';
            } else if (hadLight) {
                html.classList.add('light');
                html.style.colorScheme = 'light';
            } else {
                html.style.colorScheme = '';
            }
        };
    }, []);

    return <>{children}</>;
}

