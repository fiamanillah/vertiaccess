'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';

interface ReviewHeaderProps {
    siteName: string;
    createdAt?: string;
}

function getRelativeTimeString(dateString?: string): string {
    if (!dateString) return 'recently';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'yesterday';
        return `${diffDays} days ago`;
    } catch {
        return 'recently';
    }
}

export function ReviewHeader({ siteName, createdAt }: ReviewHeaderProps) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/5">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild className="hover:bg-accent">
                    <Link href="/dashboard/admin/verifications/sites">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back to Queue
                    </Link>
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-tight">Reviewing: {siteName}</h1>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-widest font-bold">
                            <Clock className="h-3 w-3" /> Submitted {getRelativeTimeString(createdAt)}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold uppercase tracking-widest text-[9px] px-2 h-6">
                    Verification Pending
                </Badge>
            </div>
        </div>
    );
}
