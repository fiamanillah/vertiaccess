// ─── Shared types & constants for all map components ─────────────────────────

export interface MapCenter {
    lat: number;
    lng: number;
}

export type GeometryMode = 'circle' | 'polygon';

/** Which operational boundary is currently being edited */
export type ActiveBoundary = 'toal' | 'emergency';

export interface BoundaryState {
    geometryMode: GeometryMode;
    radius: number;
    polygonPoints: [number, number][];
    isPolygonComplete: boolean;
}

export const DEFAULT_CENTER: MapCenter = { lat: 51.505, lng: -0.09 };

export const BOUNDARY_COLORS = {
    toal: {
        stroke: '#5b6cf9',       // indigo — primary
        fill: '#5b6cf9',
        fillOpacity: 0.12,
        markerBorder: '#5b6cf9',
        markerPing: 'rgba(91, 108, 249, 0.28)',
    },
    emergency: {
        stroke: '#f59e0b',       // amber — warning
        fill: '#f59e0b',
        fillOpacity: 0.1,
        markerBorder: '#f59e0b',
        markerPing: 'rgba(245, 158, 11, 0.28)',
    },
    bg: '#ffffff',
} as const;

export const DEFAULT_TOAL_RADIUS = 100;       // metres
export const DEFAULT_EMERGENCY_RADIUS = 350;  // metres — larger than TOAL
