'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';
import { Plus, Minus } from 'lucide-react';
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

// ─── Custom Zoom Buttons ──────────────────────────────────────────────────────

interface ZoomControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
}

function ZoomControls({ onZoomIn, onZoomOut }: ZoomControlsProps) {
    return (
        <div className="flex flex-col gap-0 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={onZoomIn}
                className="flex items-center justify-center w-8 h-8 hover:bg-muted/60 transition-colors text-foreground"
                aria-label="Zoom in"
            >
                <Plus className="h-3.5 w-3.5" />
            </button>
            <div className="h-px bg-border mx-1" />
            <button
                type="button"
                onClick={onZoomOut}
                className="flex items-center justify-center w-8 h-8 hover:bg-muted/60 transition-colors text-foreground"
                aria-label="Zoom out"
            >
                <Minus className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

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
        mapInstance,
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

    const handleZoomIn = () => mapInstance.current?.zoomIn();
    const handleZoomOut = () => mapInstance.current?.zoomOut();

    return (
        <div className={cn('h-full w-full flex flex-col relative', className)}>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[350px]">
                <MapSearchBar onSearch={handleSearch} />
            </div>

            <div className="relative flex-1">
                <div
                    ref={mapRef}
                    className="w-full h-full z-0"
                />

                {/* Top-left: boundary switcher (only when emergency is active) */}
                <div className="absolute top-4 left-4 z-[1000]">
                    <BoundarySwitcher
                        activeBoundary={activeBoundary}
                        showEmergency={showEmergency}
                        onSwitch={onActiveBoundaryChange}
                    />
                </div>

                {/* Top-right: satellite toggle */}
                <div className="absolute top-4 right-4 z-[1000]">
                    <SatelliteToggle isSatellite={isSatellite} onToggle={() => setIsSatellite(!isSatellite)} />
                </div>

                {/* Bottom-left: polygon toolbar (draw / undo / finish) */}
                <div className="absolute bottom-4 left-4 z-[1000]">
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

                {/* Bottom-right: zoom controls + coordinates */}
                <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end gap-2">
                    <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
                    <Badge
                        variant="secondary"
                        className="text-[10px] font-mono bg-background/90 backdrop-blur-sm border shadow-sm pointer-events-none"
                    >
                        {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
                    </Badge>
                </div>
            </div>
        </div>
    );
}
