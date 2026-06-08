'use client';

import * as React from 'react';
import { DetailedSite } from '../schema';
import { AssetManagerMap } from './asset-manager-map';
import { AssetManagerSiteList } from './asset-manager-site-list';
import { useRouter } from 'next/navigation';

interface AssetManagerMapContainerProps {
    sites: DetailedSite[];
}

export function AssetManagerMapContainer({ sites }: AssetManagerMapContainerProps) {
    const router = useRouter();
    const [selectedSiteIds, setSelectedSiteIds] = React.useState<string[]>([]);
    const [focusedSiteId, setFocusedSiteId] = React.useState<string | null>(null);
    const [focusTrigger, setFocusTrigger] = React.useState<number>(0);

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
        setFocusedSiteId(siteId);
        setFocusTrigger(prev => prev + 1);
        // Toggle selection when clicking on the map marker
        setSelectedSiteIds(prev => {
            if (prev.includes(siteId)) {
                return prev.filter(id => id !== siteId);
            } else {
                return [...prev, siteId];
            }
        });
    }, []);

    const handleFocusSite = React.useCallback((siteId: string) => {
        setFocusedSiteId(siteId);
        setFocusTrigger(prev => prev + 1);
        setSelectedSiteIds(prev => {
            if (!prev.includes(siteId)) {
                return [...prev, siteId];
            }
            return prev;
        });
    }, []);

    const handleNavigateToDetails = React.useCallback((siteId: string) => {
        router.push(`/dashboard/assetmanager/infrastructure/${siteId}`);
    }, [router]);

    return (
        <div className="flex flex-col lg:flex-row w-full h-full shadow-sm rounded-2xl relative z-0">
            <div className="flex-1 min-h-[400px] lg:h-full">
                <AssetManagerMap 
                    sites={sites} 
                    selectedSiteIds={selectedSiteIds} 
                    onSiteSelect={handleMapSiteSelect}
                    focusedSiteId={focusedSiteId}
                    focusTrigger={focusTrigger}
                />
            </div>
            <div className="w-full lg:w-[380px] shrink-0 lg:h-full">
                <AssetManagerSiteList 
                    sites={sites} 
                    selectedSiteIds={selectedSiteIds}
                    onSelectSite={handleSelectSite}
                    onFocusSite={handleFocusSite}
                    onNavigateToDetails={handleNavigateToDetails}
                    className="border-t-0 lg:border-t lg:border-l-0 lg:rounded-l-none lg:rounded-r-2xl rounded-b-2xl lg:rounded-bl-none lg:h-full"
                />
            </div>
        </div>
    );
}
