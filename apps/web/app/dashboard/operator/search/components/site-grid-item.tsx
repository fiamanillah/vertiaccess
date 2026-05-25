import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Zap, Shield } from 'lucide-react';
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
    const formattedCategory = site.siteCategory ? site.siteCategory.replace(/_/g, ' ') : '';

    const handleNavigate = () => {
        router.push(`/dashboard/operator/search/${site.id}`);
    };

    // Use a placeholder image from photoUrl or a fallback gradient
    const hasImage = !!site.photoUrl;
    const imageUrl = site.photoUrl;

    return (
        <div 
            onClick={handleNavigate}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-background/80 hover:bg-background hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
            {/* Top Image / Placeholder */}
            <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                {hasImage ? (
                    <img 
                        src={imageUrl!} 
                        alt={site.name} 
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 flex flex-col items-center justify-center p-6 text-center">
                        <MapPin className="h-8 w-8 text-indigo-500/40 mb-1 transition-transform duration-500 group-hover:scale-110" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500/60">VertiAccess Site</span>
                    </div>
                )}
                
                <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                    <Badge className={cn(
                        "border-none text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-md text-white",
                        isEmergency ? "bg-rose-500/90" : "bg-indigo-600/90"
                    )}>
                        {isEmergency ? 'Emergency' : 'TOAL'}
                    </Badge>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background/95 backdrop-blur-md text-[9px] font-black uppercase tracking-wider shadow-sm border border-border/20">
                    {isAuto ? (
                        <>
                            <Zap className="h-2.5 w-2.5 text-emerald-500 fill-emerald-500" />
                            <span className="text-emerald-700">Auto</span>
                        </>
                    ) : (
                        <>
                            <Shield className="h-2.5 w-2.5 text-blue-500" />
                            <span className="text-blue-700">Manual</span>
                        </>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="flex flex-col flex-1 p-4 gap-3.5">
                <div className="space-y-1">
                    <h3 className="font-extrabold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                        {site.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <MapPin className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                        <span className="truncate text-xs">{site.address}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {formattedCategory && (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/20">
                            {formattedCategory}
                        </span>
                    )}
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/20">
                        {site.siteType || 'standard'}
                    </span>
                </div>

                {/* Footer / Actions */}
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/40">
                    <div className="flex flex-col">
                        <span className="text-base font-extrabold text-foreground">£{(fee || 0).toFixed(2)}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">/ operation</span>
                    </div>
                    <Button 
                        variant={isAuto ? "default" : "secondary"} 
                        size="sm" 
                        className={cn(
                            "h-8 text-xs font-bold px-4 rounded-xl shadow-xs transition-all",
                            isAuto && "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                    >
                        View Details
                    </Button>
                </div>
            </div>
        </div>
    );
}
