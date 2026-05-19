import * as React from 'react';
import { MapPin, Navigation, Zap, Shield, FileText } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import Link from 'next/link';

interface SiteListItemProps {
    site: any;
}

export function SiteListItem({ site }: SiteListItemProps) {
    const isAuto = site.autoApprove === true;
    const isEmergency = site.siteType === 'emergency';
    const fee = isEmergency ? site.clzAccessFee : site.toalAccessFee;
    const formattedCategory = site.siteCategory ? site.siteCategory.replace(/_/g, ' ') : '';

    return (
        <div className="group flex flex-col gap-4 rounded-xl border border-border/50 bg-background p-4 hover:border-primary/30 hover:shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between">
            {/* Left Column (Identity) */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <h3 className="font-bold text-base leading-tight flex items-center gap-2">
                    {site.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <MapPin className="h-3 w-3" />
                    <span>{site.address}</span>
                </div>
            </div>

            {/* Middle Column (Attributes - Badges) */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
                {formattedCategory && (
                    <Badge variant="outline" className="h-6 px-2 text-[10px] uppercase font-bold tracking-tight bg-muted/30 border-muted-foreground/20">
                        {formattedCategory}
                    </Badge>
                )}
                
                <Badge className={cn(
                    "h-6 px-2 border-none text-[10px] uppercase font-bold tracking-tight",
                    isEmergency ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
                )}>
                    {isEmergency ? 'Emergency' : 'TOAL'}
                </Badge>

                {isAuto ? (
                    <Badge className="h-6 px-2 border-none text-[10px] uppercase font-bold tracking-tight bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <Zap className="h-3 w-3 fill-emerald-700" /> Auto-Approval
                    </Badge>
                ) : (
                    <Badge className="h-6 px-2 border-none text-[10px] uppercase font-bold tracking-tight bg-blue-100 text-blue-700 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Manual
                    </Badge>
                )}
            </div>

            {/* Right Column (Conversion) */}
            <div className="flex items-center gap-4 sm:justify-end shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/50">
                <div className="flex flex-col items-start sm:items-end flex-1 sm:flex-none">
                    <span className="text-sm font-bold">£{fee || 0}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">/ operation</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold px-3" asChild>
                        <Link href={`/dashboard/operator/search/${site.id}`}>Details</Link>
                    </Button>
                    <Button 
                        variant={isAuto ? "default" : "secondary"} 
                        size="sm" 
                        asChild
                        className={cn("h-8 text-xs font-bold px-4", isAuto && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                    >
                        <Link href={`/dashboard/operator/search/${site.id}`}>
                            {isAuto ? 'Quick Book' : 'Request'}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
