'use client';

import * as React from 'react';
import { DetailedSite } from '../schema';
import { AssetManagerMap } from './asset-manager-map';
import { AssetManagerSiteList } from './asset-manager-site-list';
import { AssetManagerSiteDetails } from './asset-manager-site-details';

interface AssetManagerMapContainerProps {
    sites: DetailedSite[];
}

export function AssetManagerMapContainer({ sites }: AssetManagerMapContainerProps) {
    const [selectedSiteIds, setSelectedSiteIds] = React.useState<string[]>([]);
    const [focusedSiteId, setFocusedSiteId] = React.useState<string | null>(null);
    const [focusTrigger, setFocusTrigger] = React.useState<number>(0);
    const [activeDetailSiteId, setActiveDetailSiteId] = React.useState<string | null>(null);

    const handleSelectSite = React.useCallback((siteId: string, isSelected: boolean) => {
        setSelectedSiteIds(prev => {
            if (isSelected) {
                setFocusedSiteId(siteId);
                return [...prev, siteId];
            } else {
                if (focusedSiteId === siteId) {
                    setFocusedSiteId(null);
                }
                return prev.filter(id => id !== siteId);
            }
        });
    }, [focusedSiteId]);

    const handleMapSiteSelect = React.useCallback((siteId: string) => {
        setFocusedSiteId(siteId);
        setFocusTrigger(prev => prev + 1);
        setActiveDetailSiteId(siteId);
        setSelectedSiteIds(prev => {
            if (!prev.includes(siteId)) {
                return [...prev, siteId];
            }
            return prev;
        });
    }, []);

    const handleFocusSite = React.useCallback((siteId: string) => {
        setFocusedSiteId(siteId);
        setFocusTrigger(prev => prev + 1);
        setActiveDetailSiteId(siteId);
        setSelectedSiteIds(prev => {
            if (!prev.includes(siteId)) {
                return [...prev, siteId];
            }
            return prev;
        });
    }, []);

    const handleNavigateToDetails = React.useCallback((siteId: string) => {
        setFocusedSiteId(siteId);
        setFocusTrigger(prev => prev + 1);
        setActiveDetailSiteId(siteId);
        setSelectedSiteIds(prev => {
            if (!prev.includes(siteId)) {
                return [...prev, siteId];
            }
            return prev;
        });
    }, []);

    const activeSite = activeDetailSiteId ? sites.find(s => s.id === activeDetailSiteId) : null;

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
                {activeSite ? (
                    <AssetManagerSiteDetails
                        site={activeSite}
                        onBack={() => setActiveDetailSiteId(null)}
                        className="border-t-0 lg:border-t lg:border-l-0 lg:rounded-l-none lg:rounded-r-2xl rounded-b-2xl lg:rounded-bl-none lg:h-full min-h-0 lg:min-h-0"
                    />
                ) : (
                    <AssetManagerSiteList 
                        sites={sites} 
                        selectedSiteIds={selectedSiteIds}
                        onSelectSite={handleSelectSite}
                        onFocusSite={handleFocusSite}
                        onNavigateToDetails={handleNavigateToDetails}
                        className="border-t-0 lg:border-t lg:border-l-0 lg:rounded-l-none lg:rounded-r-2xl rounded-b-2xl lg:rounded-bl-none lg:h-full"
                    />
                )}
            </div>
        </div>
    );
}
