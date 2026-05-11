'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';
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
    initialToalPolygonPoints,
    initialEmergencyPolygonPoints,
    toalMode,
    emergencyMode,
    className,
}: PreviewMapProps) {
    const mapRef = React.useRef<HTMLDivElement>(null);

    const { isSatellite, setIsSatellite } = useLeafletMap({
        mapRef,
        initialCenter: center,
        toalRadius,
        emergencyRadius,
        showEmergency,
        activeBoundary: 'toal', // Both are rendered if present, active boundary doesn't matter for drawing here
        initialToalPolygonPoints,
        initialEmergencyPolygonPoints,
        toalMode,
        emergencyMode,
        onCenterChange: () => {},
        onToalPolygonChange: () => {},
        onEmergencyPolygonChange: () => {},
        readOnly: true,
    });

    return (
        <div className={cn('relative', className)}>
            <div
                ref={mapRef}
                className="w-full h-[420px] rounded-xl overflow-hidden border border-border z-0 shadow-inner"
                style={{ minHeight: 300 }}
            />

            {/* Top-right: satellite toggle */}
            <div className="absolute top-3 right-3 z-10">
                <SatelliteToggle isSatellite={isSatellite} onToggle={() => setIsSatellite(!isSatellite)} />
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
    );
}
