'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import {
    SidebarGroup,
    SidebarGroupContent,
    useSidebar,
} from '@workspace/ui/components/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@workspace/ui/components/tooltip';

function UpgradeCardContent() {
    return (
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4 w-52">
            {/* Decorative glow */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative space-y-3">
                {/* Plan info */}
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                        <Zap size={13} className="text-primary fill-primary/40" />
                        <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                            Landowner Pro
                        </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                        Upgrade to Enterprise for unlimited sites &amp; priority support.
                    </p>
                </div>

                {/* CTA */}
                <Link
                    href="/dashboard/billing"
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/30 hover:opacity-90 transition-opacity"
                >
                    <Zap size={11} className="fill-primary-foreground/60" />
                    Upgrade Plan
                </Link>
            </div>
        </div>
    );
}

export function PlanUpgradeBox() {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    if (isCollapsed) {
        return (
            <SidebarGroup className="mt-auto">
                <SidebarGroupContent className="flex justify-center pb-2">
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    aria-label="Upgrade Plan"
                                >
                                    <Zap size={16} className="fill-primary/30" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="right"
                                sideOffset={12}
                                className="p-0 border-0 bg-transparent shadow-xl"
                            >
                                <UpgradeCardContent />
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    return (
        <SidebarGroup className="mt-auto">
            <SidebarGroupContent className="pb-2">
                <UpgradeCardContent />
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
