import * as React from 'react';
import { DetailedSite } from '../schema';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Button } from '@workspace/ui/components/button';
import { ExternalLink, MapPin, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@workspace/ui/components/tooltip';

interface AssetManagerSiteListProps {
    sites: DetailedSite[];
    selectedSiteIds: string[];
    onSelectSite: (siteId: string, isSelected: boolean) => void;
    onFocusSite?: (siteId: string) => void;
    onNavigateToDetails: (siteId: string) => void;
    className?: string;
}

function getStatusMeta(status: DetailedSite['status']) {
  if (status === 'active') {
    return { label: 'Active', className: 'bg-emerald-100 text-emerald-700' }
  }
  if (status === 'pending') {
    return { label: 'Pending', className: 'bg-amber-100 text-amber-700' }
  }
  if (status === 'disabled') {
    return { label: 'Disabled', className: 'bg-slate-100 text-slate-700' }
  }
  if (status === 'temporary_unavailable') {
    return { label: 'Temporary Unavailable', className: 'bg-orange-100 text-orange-700' }
  }
  return { label: 'Rejected', className: 'bg-red-100 text-red-700' }
}

function getAssetTypeLabel(category: string) {
  const mapping: Record<string, string> = {
    private_land: 'Private Land',
    helipad: 'Helipad',
    vertiport: 'Vertiport',
    droneport: 'Drone Port',
    temporary_landing_site: 'Temp Landing Site',
  }
  return mapping[category] || category
}

export function AssetManagerSiteList({
    sites,
    selectedSiteIds,
    onSelectSite,
    onFocusSite,
    onNavigateToDetails,
    className
}: AssetManagerSiteListProps) {
    const [pageIndex, setPageIndex] = React.useState(0);
    const pageSize = 10;
    const totalPages = Math.ceil(sites.length / pageSize) || 1;
    
    // Reset to page 0 if sites change heavily
    React.useEffect(() => {
        setPageIndex(0);
    }, [sites.length]);

    const paginatedSites = sites.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    
    return (
        <div className={cn("flex flex-col h-[600px] bg-card border-y border-r border-border/60 rounded-r-2xl overflow-hidden", className)}>
            <div className="p-4 border-b border-border/60 bg-muted/30">
                <h3 className="font-bold text-sm text-foreground tracking-tight">Your Assets ({sites.length})</h3>
                <p className="text-xs text-muted-foreground mt-1">Select assets to view them on the map.</p>
            </div>
            
            <ScrollArea className="flex-1">
                <div className="flex flex-col divide-y divide-border/40 pb-20">
                    {paginatedSites.map(site => {
                        const isSelected = selectedSiteIds.includes(site.id);
                        const statusMeta = getStatusMeta(site.status);
                        const vaSiteId = site.vaId ? site.vaId.toUpperCase() : `VA-${site.id.substring(0, 6).toUpperCase()}`;
                        
                        return (
                            <div 
                                key={site.id} 
                                className={cn(
                                    "p-4 transition-colors hover:bg-muted/30 flex gap-3 cursor-pointer",
                                    isSelected && "bg-primary/5 hover:bg-primary/10"
                                )}
                                onClick={() => onFocusSite && onFocusSite(site.id)}
                            >
                                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={isSelected}
                                        onCheckedChange={(checked) => onSelectSite(site.id, !!checked)}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                            {vaSiteId}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5 border-none h-5", statusMeta.className)}>
                                                {statusMeta.label}
                                            </Badge>
                                            {site.status === 'rejected' && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div 
                                                                className="text-red-500 hover:text-red-600 cursor-pointer transition-transform duration-200 hover:scale-110 flex items-center justify-center size-6 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 shadow-sm relative shrink-0"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping" />
                                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-destructive text-destructive-foreground p-2 text-xs rounded shadow-md max-w-xs">
                                                            <p className="font-semibold">Rejection Comment:</p>
                                                            <p>{site.reason || 'No comments provided.'}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNavigateToDetails(site.id);
                                                }}
                                                title="View Details"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <h4 
                                        className="font-bold text-sm text-foreground truncate cursor-pointer hover:text-primary" 
                                    >
                                        {site.name}
                                    </h4>
                                    
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary" className="text-xs font-semibold h-6 px-2.5 bg-muted/60 border-none capitalize">
                                            {getAssetTypeLabel(site.category)}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {site.postcode}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    
                    {paginatedSites.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No assets found.
                        </div>
                    )}
                </div>
            </ScrollArea>
            
            {/* Pagination Controls */}
            {sites.length > 0 && (
                <div className="p-3 border-t border-border/60 bg-muted/10 flex items-center justify-between mt-auto">
                    <span className="text-xs text-muted-foreground font-medium pl-2">
                        {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, sites.length)} of {sites.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={pageIndex === 0}
                            onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={pageIndex >= totalPages - 1}
                            onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
