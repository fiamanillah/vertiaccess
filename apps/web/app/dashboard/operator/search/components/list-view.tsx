import * as React from 'react';
import { SiteListItem } from './site-list-item';
import type { DetailedSite } from '../../../landowner/infrastructure/schema';

interface ListViewProps {
    sites: DetailedSite[];
}

export function ListView({ sites }: ListViewProps) {
    if (sites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border/60 bg-muted/20">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <span className="text-xl">🚁</span>
                </div>
                <h3 className="text-lg font-bold">No sites found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    Try adjusting your filters or expanding your search radius to find more operational boundaries.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    {sites.length} Results Found
                </h2>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                    Sorted by: Distance
                </span>
            </div>
            
            <div className="flex flex-col gap-3">
                {sites.map(site => (
                    <SiteListItem key={site.id} site={site} />
                ))}
            </div>
        </div>
    );
}
