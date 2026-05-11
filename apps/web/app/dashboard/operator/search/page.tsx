'use client';

import * as React from 'react';
import { SearchHeader } from './components/search-header';
import { ListView } from './components/list-view';
import { GridView } from './components/grid-view';
import { MapView } from './components/map-view';
import { mockSites } from './data/mock-sites';
import { DEFAULT_CENTER } from '@/components/map/map-types';

export default function SearchAndDiscoveryPage() {
    const [viewMode, setViewMode] = React.useState<'list' | 'grid' | 'map'>('grid');
    const [searchQuery, setSearchQuery] = React.useState('');

    // In a real application, you would filter sites based on searchQuery, radius, siteType, etc.
    // For this prototype, we'll just pass all mock sites or do a simple text filter
    const filteredSites = React.useMemo(() => {
        if (!searchQuery) return mockSites;
        const lowerQ = searchQuery.toLowerCase();
        return mockSites.filter(s => 
            s.name.toLowerCase().includes(lowerQ) || 
            s.address.toLowerCase().includes(lowerQ) ||
            s.postcode.toLowerCase().includes(lowerQ)
        );
    }, [searchQuery]);

    return (
        <div className="flex flex-col flex-1 relative w-full h-full max-w-7xl mx-auto space-y-4 pb-12">
            <SearchHeader 
                viewMode={viewMode}
                onViewChange={setViewMode}
                onSearch={setSearchQuery}
                currentQuery={searchQuery}
            />

            <div className="flex-1 w-full h-full flex flex-col pt-2 animate-in fade-in zoom-in-95 duration-200">
                {viewMode === 'list' && (
                    <div className="max-w-4xl mx-auto w-full">
                        <ListView sites={filteredSites} />
                    </div>
                )}
                {viewMode === 'grid' && (
                    <div className="w-full">
                        <GridView sites={filteredSites} />
                    </div>
                )}
                {viewMode === 'map' && (
                    <MapView 
                        sites={filteredSites} 
                        center={DEFAULT_CENTER}
                    />
                )}
            </div>
        </div>
    );
}
