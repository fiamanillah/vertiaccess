'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import type { MapCenter, GeometryMode } from './map-types';
import { useLeafletMap } from './use-leaflet-map';
import { SatelliteToggle, ZoomControls } from './map-controls';

interface PreviewMapProps {
    center: MapCenter;
    toalRadius: number;
    emergencyRadius: number;
    showEmergency: boolean;
    showToal?: boolean;
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
    showToal,
    toalMode,
    emergencyMode,
    initialToalPolygonPoints,
    initialEmergencyPolygonPoints,
    className,
}: PreviewMapProps) {
    const mapRef = React.useRef<HTMLDivElement>(null);

    // Provide empty/no-op handlers since it's preview only
    const noop = () => { };

    const { isSatellite, setIsSatellite, mapInstance } = useLeafletMap({
        mapRef,
        initialCenter: center,
        toalRadius,
        emergencyRadius,
        showEmergency,
        showToal,
        readOnly: true,
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

    const handleZoomIn = () => mapInstance.current?.zoomIn();
    const handleZoomOut = () => mapInstance.current?.zoomOut();

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

            {/* Bottom-right: zoom controls */}
            <div className="absolute bottom-4 right-4 z-[1000]">
                <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
            </div>
        </div>
    );
}
