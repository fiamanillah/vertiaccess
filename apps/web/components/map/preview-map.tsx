'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import type { MapCenter, GeometryMode } from './map-types';
import { useLeafletMap } from './use-leaflet-map';
import { SatelliteToggle } from './map-controls';

interface PreviewMapProps {
    center: MapCenter;
    toalRadius: number;
    emergencyRadius: number;
    showEmergency: boolean;
    toalMode: GeometryMode;
    emergencyMode: GeometryMode;
    initialToalPolygonPoints?: [number, number][];
    initialEmergencyPolygonPoints?: [number, number][];
    className?: string;
}

export function PreviewMap({
    center,
    toalRadius,
    emergencyRadius,
    showEmergency,
    toalMode,
    emergencyMode,
    initialToalPolygonPoints,
    initialEmergencyPolygonPoints,
    className,
}: PreviewMapProps) {
    const mapRef = React.useRef<HTMLDivElement>(null);

    // Provide empty/no-op handlers since it's preview only
    const noop = () => { };

    const { isSatellite, setIsSatellite } = useLeafletMap({
        mapRef,
        initialCenter: center,
        toalRadius,
        emergencyRadius,
        showEmergency,
        // The active boundary doesn't matter for preview, but we can default to 'toal'
        activeBoundary: 'toal',
        initialToalPolygonPoints,
        initialEmergencyPolygonPoints,
        toalMode,
        emergencyMode,
        onCenterChange: noop,
        onToalPolygonChange: noop,
        onEmergencyPolygonChange: noop,
    });

    return (
        <div className={cn('h-full w-full relative', className)}>
            <div
                ref={mapRef}
                className="w-full h-full z-0"
            />

            {/* Top-right: satellite toggle */}
            <div className="absolute top-4 right-4 z-[1000]">
                <SatelliteToggle isSatellite={isSatellite} onToggle={() => setIsSatellite(!isSatellite)} />
            </div>
        </div>
    );
}
