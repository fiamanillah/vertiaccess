'use client';

import * as React from 'react';
import { DetailedSite } from '../schema';
import { LandownerMap } from './landowner-map';
import { LandownerSiteList } from './landowner-site-list';
import { useRouter } from 'next/navigation';

interface LandownerMapContainerProps {
    sites: DetailedSite[];
}

export function LandownerMapContainer({ sites }: LandownerMapContainerProps) {
    const router = useRouter();
    const [selectedSiteIds, setSelectedSiteIds] = React.useState<string[]>([]);
    const [focusedSiteId, setFocusedSiteId] = React.useState<string | null>(null);

    const handleSelectSite = React.useCallback((siteId: string, isSelected: boolean) => {
        setSelectedSiteIds(prev => {
            if (isSelected) {
                setFocusedSiteId(siteId);
                return [...prev, siteId];
            } else {
                return prev.filter(id => id !== siteId);
            }
        });
    }, []);

    const handleMapSiteSelect = React.useCallback((siteId: string) => {
        // Toggle selection when clicking on the map marker
        setSelectedSiteIds(prev => {
            if (prev.includes(siteId)) {
                return prev.filter(id => id !== siteId);
            } else {
                return [...prev, siteId];
            }
        });
    }, []);

    const handleNavigateToDetails = React.useCallback((siteId: string) => {
        router.push(`/dashboard/landowner/infrastructure/${siteId}`);
    }, [router]);

    return (
        <div className="flex flex-col lg:flex-row w-full shadow-sm rounded-2xl relative z-0">
            <div className="flex-1 min-h-[600px] lg:h-[600px]">
                <LandownerMap 
                    sites={sites} 
                    selectedSiteIds={selectedSiteIds} 
                    onSiteSelect={handleMapSiteSelect}
                    focusedSiteId={focusedSiteId}
                />
            </div>
            <div className="w-full lg:w-[380px] shrink-0">
                <LandownerSiteList 
                    sites={sites} 
                    selectedSiteIds={selectedSiteIds}
                    onSelectSite={handleSelectSite}
                    onNavigateToDetails={handleNavigateToDetails}
                    className="border-t-0 lg:border-t lg:border-l-0 lg:rounded-l-none lg:rounded-r-2xl rounded-b-2xl lg:rounded-bl-none"
                />
            </div>
        </div>
    );
}
