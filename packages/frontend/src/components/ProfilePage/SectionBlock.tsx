import type { ReactNode } from 'react';

interface SectionBlockProps {
    title: string;
    children: ReactNode;
}

export function SectionBlock({ title, children }: SectionBlockProps) {
    return (
        <section className="space-y-2.5 pt-1 first:pt-0">
            <div className="flex flex-col gap-1">
                <h3 className="text-base md:text-lg font-semibold text-slate-900">{title}</h3>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 md:p-4 space-y-2.5">
                {children}
            </div>
        </section>
    );
}
