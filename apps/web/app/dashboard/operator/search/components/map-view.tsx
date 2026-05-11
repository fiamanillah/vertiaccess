import * as React from 'react';
import { SearchMap } from './search-map';
import type { DetailedSite } from '../../../landowner/sites/schema';
import { MapCenter } from '@/components/map/map-types';

interface MapViewProps {
    sites: DetailedSite[];
    center: MapCenter;
}

export function MapView({ sites, center }: MapViewProps) {
    return (
        <div className="w-full rounded-2xl overflow-hidden border border-border/60 shadow-sm relative z-0 flex-1 min-h-[600px]">
            <SearchMap
                sites={sites}
                center={center}
                className='min-h-[600px]'
            />
        </div>
    );
}
