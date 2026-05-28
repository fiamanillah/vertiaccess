import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Zap, Shield, Building2 } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

interface SiteGridItemProps {
    site: any;
}

export function SiteGridItem({ site }: SiteGridItemProps) {
    const router = useRouter();
    const isAuto = site.autoApprove === true;
    const isEmergency = site.siteType === 'emergency';
    const fee = isEmergency ? site.clzAccessFee : site.toalAccessFee;
    const formattedCategory = site.siteCategory
        ? site.siteCategory.replace(/_/g, ' ')
        : '';

    const handleNavigate = () => {
        router.push(`/dashboard/operator/search/${site.id}`);
    };

    return (
        <div
            onClick={handleNavigate}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-background/80 hover:bg-background hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
            {/* Card Header — primary-tinted accent area */}
            <div className={cn(
                'relative px-4 pt-4 pb-3',
                isEmergency
                    ? 'bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent'
                    : 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent'
            )}>
                {/* Top row: site-type badge + approval pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge className={cn(
                        'border-none text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full shadow-sm text-primary-foreground',
                        isEmergency ? 'bg-destructive' : 'bg-primary'
                    )}>
                        {isEmergency ? 'Emergency' : 'TOAL'}
                    </Badge>

                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background/90 text-[9px] font-black uppercase tracking-wider border border-border/30 shadow-sm">
                        {isAuto ? (
                            <>
                                <Zap className="h-2.5 w-2.5 text-emerald-500 fill-emerald-500" />
                                <span className="text-emerald-700 dark:text-emerald-400">Auto-Approval</span>
                            </>
                        ) : (
                            <>
                                <Shield className="h-2.5 w-2.5 text-primary/70" />
                                <span className="text-primary/80">Manual Review</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Site name + icon */}
                <div className="flex items-start gap-2.5">
                    <div className={cn(
                        'shrink-0 h-9 w-9 rounded-xl flex items-center justify-center',
                        isEmergency ? 'bg-destructive/15' : 'bg-primary/15'
                    )}>
                        <Building2 className={cn(
                            'h-4 w-4',
                            isEmergency ? 'text-destructive' : 'text-primary'
                        )} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-extrabold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                            {site.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                            <span className="truncate">{site.address}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border/40 mx-4" />

            {/* Content Body */}
            <div className="flex flex-col flex-1 px-4 py-3 gap-3">
                {/* Category tags */}
                {formattedCategory && (
                    <div className="flex flex-wrap gap-1.5">
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/20 capitalize">
                            {formattedCategory}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/20">
                            {site.siteType || 'standard'}
                        </span>
                    </div>
                )}

                {/* Postcode */}
                {site.postcode && (
                    <p className="text-[11px] text-muted-foreground font-medium">
                        <span className="text-foreground/60 font-semibold">Postcode:</span>{' '}
                        {site.postcode}
                    </p>
                )}

                {/* Footer / Price + CTA */}
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/40">
                    <div className="flex flex-col">
                        <span className="text-base font-extrabold text-foreground">
                            {fee != null ? `£${Number(fee).toFixed(2)}` : 'Free'}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                            / operation
                        </span>
                    </div>
                    <Button
                        variant={isAuto ? 'default' : 'secondary'}
                        size="sm"
                        className="h-8 text-xs font-bold px-4 rounded-xl shadow-xs transition-all"
                    >
                        View Details
                    </Button>
                </div>
            </div>
        </div>
    );
}
