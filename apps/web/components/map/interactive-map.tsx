'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';
import type { MapCenter, GeometryMode, ActiveBoundary } from './map-types';
import { useLeafletMap } from './use-leaflet-map';
import { MapSearchBar, SatelliteToggle, BoundarySwitcher, PolygonToolbar } from './map-controls';

// ─── Geocode helper ───────────────────────────────────────────────────────────

export async function geocodeQuery(query: string): Promise<MapCenter> {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'VertiAccess/1.0' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    throw new Error('Location not found');
}

// ─── Re-export types consumed by siblings ────────────────────────────────────

export type { MapCenter, GeometryMode, ActiveBoundary };

// ─── Props ────────────────────────────────────────────────────────────────────

interface InteractiveMapProps {
    center: MapCenter;
    toalRadius: number;
    emergencyRadius: number;
    showEmergency: boolean;
    activeBoundary: ActiveBoundary;
    toalMode: GeometryMode;
    emergencyMode: GeometryMode;
    initialToalPolygonPoints?: [number, number][];
    initialEmergencyPolygonPoints?: [number, number][];
    onActiveBoundaryChange: (b: ActiveBoundary) => void;
    onCenterChange: (c: MapCenter) => void;
    onToalPolygonChange: (pts: [number, number][]) => void;
    onEmergencyPolygonChange: (pts: [number, number][]) => void;
    className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InteractiveMap({
    center,
    toalRadius,
    emergencyRadius,
    showEmergency,
    activeBoundary,
    initialToalPolygonPoints,
    initialEmergencyPolygonPoints,
    toalMode,
    emergencyMode,
    onActiveBoundaryChange,
    onCenterChange,
    onToalPolygonChange,
    onEmergencyPolygonChange,
    className,
}: InteractiveMapProps) {
    const mapRef = React.useRef<HTMLDivElement>(null);

    const {
        isSatellite, setIsSatellite,
        finishPolygon, undoLastPoint, resetPolygon,
        toalPolygonPoints, toalPolygonComplete,
        emergencyPolygonPoints, emergencyPolygonComplete,
    } = useLeafletMap({
        mapRef,
        initialCenter: center,
        toalRadius,
        emergencyRadius,
        showEmergency,
        activeBoundary,
        initialToalPolygonPoints,
        initialEmergencyPolygonPoints,
        toalMode,
        emergencyMode,
        onCenterChange,
        onToalPolygonChange,
        onEmergencyPolygonChange,
    });

    // Polygon state for the currently active boundary
    const activePolygonPoints = activeBoundary === 'toal' ? toalPolygonPoints : emergencyPolygonPoints;
    const activePolygonComplete = activeBoundary === 'toal' ? toalPolygonComplete : emergencyPolygonComplete;
    const activeMode = activeBoundary === 'toal' ? toalMode : emergencyMode;

    const handleSearch = async (query: string) => {
        const result = await geocodeQuery(query);
        onCenterChange(result);
    };

    return (
        <div className={cn('space-y-4', className)}>
            <MapSearchBar onSearch={handleSearch} />

            <div className="relative">
                <div
                    ref={mapRef}
                    className="w-full h-[420px] rounded-xl overflow-hidden border border-border z-0 shadow-inner"
                    style={{ minHeight: 300 }}
                />

                {/* Top-right: satellite toggle */}
                <div className="absolute top-3 right-3 z-10">
                    <SatelliteToggle isSatellite={isSatellite} onToggle={() => setIsSatellite(!isSatellite)} />
                </div>

                {/* Top-left: boundary switcher + polygon toolbar */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                    <BoundarySwitcher
                        activeBoundary={activeBoundary}
                        showEmergency={showEmergency}
                        onSwitch={onActiveBoundaryChange}
                    />
                    <PolygonToolbar
                        geometryMode={activeMode}
                        polygonPoints={activePolygonPoints}
                        isPolygonComplete={activePolygonComplete}
                        activeBoundary={activeBoundary}
                        onFinish={finishPolygon}
                        onUndo={undoLastPoint}
                        onReset={resetPolygon}
                    />
                </div>

                {/* Bottom-left: coordinates */}
                <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
                    <Badge
                        variant="secondary"
                        className="text-[10px] font-mono bg-background/90 backdrop-blur-sm border shadow-sm pointer-events-auto"
                    >
                        {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
                    </Badge>
                </div>
            </div>
        </div>
    );
}
