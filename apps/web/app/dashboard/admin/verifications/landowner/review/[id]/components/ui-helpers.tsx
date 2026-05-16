'use client';

import * as React from 'react';
import { 
    Download, 
    ExternalLink, 
    FileText, 
    LucideIcon 
} from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';

export function DetailBox({ label, value, isBadge, badgeVariant, icon: Icon, subtitle, isHighlight }: {
    label: string;
    value: string;
    isBadge?: boolean;
    badgeVariant?: 'indigo' | 'amber' | 'emerald';
    icon?: LucideIcon;
    subtitle?: string;
    isHighlight?: boolean;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</span>
            </div>
            {isBadge ? (
                <Badge className={cn(
                    "border-none text-[10px] uppercase font-bold tracking-tight px-2.5 h-6",
                    badgeVariant === 'indigo' ? "bg-indigo-100 text-indigo-700" : 
                    badgeVariant === 'amber' ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                )}>
                    {value}
                </Badge>
            ) : (
                <div className="space-y-0.5">
                    <p className={cn(
                        "text-sm font-bold tracking-tight",
                        isHighlight ? "text-primary text-lg" : "text-foreground"
                    )}>{value}</p>
                    {subtitle && <p className="text-[11px] text-muted-foreground font-medium">{subtitle}</p>}
                </div>
            )}
        </div>
    );
}

export function DocumentListItem({ name, size, type, url }: { name: string; size?: string; type: string; url?: string }) {
    const handleView = () => {
        if (url) window.open(url, '_blank');
        else toast.info('File preview not available');
    };

    return (
        <div className="p-3 rounded-xl border border-border/50 bg-background hover:bg-muted/30 transition-all group flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="overflow-hidden">
                    <p className="text-[11px] font-bold truncate">{name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{type} • {size || 'Unknown Size'}</p>
                </div>
            </div>
            <div className="flex gap-1">
                {url && (
                    <a href={url} download={name} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-primary">
                            <Download className="h-3.5 w-3.5" />
                        </Button>
                    </a>
                )}
                <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={handleView}>
                    <ExternalLink className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

export function CheckItem({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/10 transition-colors group">
            <div className="h-5 w-5 rounded border border-border/60 flex items-center justify-center bg-background group-hover:border-primary/40 transition-colors">
                <div className="h-2 w-2 rounded-sm bg-primary/20" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
        </div>
    );
}

export function RejectionCheckbox({ id, label, checked, onCheckedChange }: { id: string; label: string; checked: boolean; onCheckedChange: () => void }) {
    return (
        <div className={cn(
            "flex items-center space-x-3 p-5 rounded-2xl border transition-all cursor-pointer",
            checked ? "bg-red-50 border-red-200 text-red-900 shadow-sm" : "bg-muted/5 border-border/30 hover:bg-muted/10"
        )} onClick={onCheckedChange}>
            <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="h-5 w-5 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" />
            <label htmlFor={id} className="text-sm font-bold leading-tight cursor-pointer flex-1">
                {label}
            </label>
        </div>
    );
}
