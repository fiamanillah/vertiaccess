import * as React from 'react';
import { MapPin, Navigation, Zap, Shield } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import type { DetailedSite } from '../../../landowner/sites/schema';

interface SiteGridItemProps {
    site: DetailedSite;
}

export function SiteGridItem({ site }: SiteGridItemProps) {
    const isAuto = site.bookingApprovalModel === 'auto';
    const isEmergency = site.siteType === 'emergency';
    const fee = isEmergency ? site.emergencyFee : site.toalFee;

    // Use a placeholder image from photoUrls or a fallback gradient
    const hasImage = site.photoUrls && site.photoUrls.length > 0;
    const imageUrl = hasImage ? site.photoUrls[0] : null;

    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-background hover:border-primary/30 hover:shadow-md transition-all">
            {/* Top Image / Placeholder */}
            <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                {hasImage ? (
                    <img 
                        src={imageUrl!} 
                        alt={site.name} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-muted/80 to-muted/20 flex items-center justify-center p-6 text-center">
                        <MapPin className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    </div>
                )}
                
                <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                    <Badge className={cn(
                        "border-none text-[10px] uppercase font-bold tracking-tight shadow-sm backdrop-blur-md",
                        isEmergency ? "bg-amber-500/90 text-white" : "bg-indigo-600/90 text-white"
                    )}>
                        {isEmergency ? 'Emergency' : 'TOAL'}
                    </Badge>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/90 backdrop-blur-md text-[10px] font-bold shadow-sm">
                    {isAuto ? (
                        <>
                            <Zap className="h-3 w-3 text-emerald-600 fill-emerald-600" />
                            <span className="text-emerald-700">Auto</span>
                        </>
                    ) : (
                        <>
                            <Shield className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-700">Manual</span>
                        </>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="flex flex-col flex-1 p-4 gap-4">
                <div className="space-y-1">
                    <h3 className="font-bold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {site.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{site.address}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold bg-muted/40 p-2.5 rounded-xl border border-border/40">
                    <div className="flex items-center gap-1.5 text-primary/80">
                        <Navigation className="h-3.5 w-3.5 shrink-0" />
                        <span>{(Math.random() * 10).toFixed(1)} mi</span>
                    </div>
                    <div className="w-px h-4 bg-border/80" />
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>{site.category}</span>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-foreground">£{fee}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">/ operation</span>
                    </div>
                    <Button 
                        variant={isAuto ? "default" : "secondary"} 
                        size="sm" 
                        className={cn("h-9 text-xs font-bold px-5", isAuto && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                    >
                        {isAuto ? 'Quick Book' : 'Request'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
