'use client';

import * as React from 'react';
import type { MapCenter, GeometryMode, ActiveBoundary } from './map-types';
import { BOUNDARY_COLORS } from './map-types';

// ─── Internal drawing state per boundary ─────────────────────────────────────

interface BoundaryRefs {
    circle: React.MutableRefObject<any>;
    marker: React.MutableRefObject<any>;
    polyline: React.MutableRefObject<any>;   // dashed preview
    polygon: React.MutableRefObject<any>;    // finished shape
    pointMarkers: React.MutableRefObject<any[]>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseLeafletMapOptions {
    mapRef: React.RefObject<HTMLDivElement | null>;
    initialCenter: MapCenter;
    toalRadius: number;
    emergencyRadius: number;
    showEmergency: boolean;
    activeBoundary: ActiveBoundary;
    initialToalPolygonPoints?: [number, number][];
    initialEmergencyPolygonPoints?: [number, number][];
    /** toal geometry mode */
    toalMode: GeometryMode;
    /** emergency geometry mode */
    emergencyMode: GeometryMode;
    onCenterChange: (center: MapCenter) => void;
    onToalPolygonChange: (pts: [number, number][]) => void;
    onEmergencyPolygonChange: (pts: [number, number][]) => void;
    readOnly?: boolean;
}

export interface UseLeafletMapReturn {
    isSatellite: boolean;
    setIsSatellite: (v: boolean) => void;
    finishPolygon: () => void;
    undoLastPoint: () => void;
    resetPolygon: () => void;
    toalPolygonPoints: [number, number][];
    toalPolygonComplete: boolean;
    emergencyPolygonPoints: [number, number][];
    emergencyPolygonComplete: boolean;
}

export function useLeafletMap({
    mapRef,
    initialCenter,
    toalRadius,
    emergencyRadius,
    showEmergency,
    activeBoundary,
    initialToalPolygonPoints = [],
    initialEmergencyPolygonPoints = [],
    toalMode,
    emergencyMode,
    onCenterChange,
    onToalPolygonChange,
    onEmergencyPolygonChange,
    readOnly = false,
}: UseLeafletMapOptions): UseLeafletMapReturn {
    const mapInstanceRef = React.useRef<any>(null);
    const leafletRef = React.useRef<any>(null);

    // Satellite layers
    const satelliteLayerRef = React.useRef<any>(null);
    const streetLayerRef = React.useRef<any>(null);
    const labelsLayerRef = React.useRef<any>(null);

    // TOAL refs
    const toal: BoundaryRefs = {
        circle: React.useRef<any>(null),
        marker: React.useRef<any>(null),
        polyline: React.useRef<any>(null),
        polygon: React.useRef<any>(null),
        pointMarkers: React.useRef<any[]>([]),
    };

    // Emergency refs
    const emg: BoundaryRefs = {
        circle: React.useRef<any>(null),
        marker: React.useRef<any>(null),
        polyline: React.useRef<any>(null),
        polygon: React.useRef<any>(null),
        pointMarkers: React.useRef<any[]>([]),
    };

    // Stable refs for closure access
    const activeBoundaryRef = React.useRef(activeBoundary);
    const toalModeRef = React.useRef(toalMode);
    const emergencyModeRef = React.useRef(emergencyMode);
    const toalPolygonCompleteRef = React.useRef(false);
    const emergencyPolygonCompleteRef = React.useRef(false);
    const toalPtsRef = React.useRef<[number, number][]>(initialToalPolygonPoints);
    const emergencyPtsRef = React.useRef<[number, number][]>(initialEmergencyPolygonPoints);

    React.useEffect(() => { activeBoundaryRef.current = activeBoundary; }, [activeBoundary]);
    React.useEffect(() => { toalModeRef.current = toalMode; }, [toalMode]);
    React.useEffect(() => { emergencyModeRef.current = emergencyMode; }, [emergencyMode]);

    // React state (for UI re-renders)
    const [isSatellite, setIsSatellite] = React.useState(true);
    const [toalPolygonPoints, setToalPolygonPoints] = React.useState<[number, number][]>(initialToalPolygonPoints);
    const [toalPolygonComplete, setToalPolygonComplete] = React.useState(initialToalPolygonPoints.length >= 3);
    const [emergencyPolygonPoints, setEmergencyPolygonPoints] = React.useState<[number, number][]>(initialEmergencyPolygonPoints);
    const [emergencyPolygonComplete, setEmergencyPolygonComplete] = React.useState(initialEmergencyPolygonPoints.length >= 3);

    // ── Bootstrap ────────────────────────────────────────────────────────────

    React.useEffect(() => {
        if (!mapRef.current) return;

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        import('leaflet').then((L) => {
            leafletRef.current = L;
            if (mapInstanceRef.current) return;

            injectLeafletStyles();

            const map = L.map(mapRef.current!, {
                center: [initialCenter.lat, initialCenter.lng],
                zoom: 16,
                zoomControl: true,
            });

            satelliteLayerRef.current = L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
            );
            streetLayerRef.current = L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
            );
            labelsLayerRef.current = L.tileLayer(
                'https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png',
                { opacity: 0.5, maxZoom: 19 }
            );
            satelliteLayerRef.current.addTo(map);
            labelsLayerRef.current.addTo(map);

            mapInstanceRef.current = map;

            // TOAL circle + marker
            const toalColors = BOUNDARY_COLORS.toal;
            toal.circle.current = L.circle([initialCenter.lat, initialCenter.lng], {
                radius: toalRadius,
                color: toalColors.stroke,
                fillColor: toalColors.fill,
                fillOpacity: toalColors.fillOpacity,
                stroke: true,
                weight: 2.5,
            }).addTo(map);

            toal.marker.current = L.marker([initialCenter.lat, initialCenter.lng], {
                draggable: !readOnly,
                icon: makeMarkerIcon(L, toalColors.markerBorder, toalColors.markerPing),
            }).addTo(map);

            toal.marker.current.on('dragend', () => {
                const pos = toal.marker.current.getLatLng();
                onCenterChange({ lat: pos.lat, lng: pos.lng });
                toal.circle.current?.setLatLng([pos.lat, pos.lng]);
            });

            // Emergency circle + marker (initially hidden)
            const emgColors = BOUNDARY_COLORS.emergency;
            emg.circle.current = L.circle([initialCenter.lat, initialCenter.lng], {
                radius: emergencyRadius,
                color: emgColors.stroke,
                fillColor: emgColors.fill,
                fillOpacity: emgColors.fillOpacity,
                stroke: true,
                weight: 2,
                dashArray: '8 4',
            });

            emg.marker.current = L.marker([initialCenter.lat, initialCenter.lng], {
                draggable: !readOnly,
                icon: makeMarkerIcon(L, emgColors.markerBorder, emgColors.markerPing),
            });

            if (showEmergency && emergencyMode === 'circle') {
                emg.circle.current.addTo(map);
                emg.marker.current.addTo(map);
            }

            emg.marker.current.on('dragend', () => {
                const pos = emg.marker.current.getLatLng();
                emg.circle.current?.setLatLng([pos.lat, pos.lng]);
            });

            // Initial polygons
            if (toalMode === 'polygon' && initialToalPolygonPoints.length >= 3) {
                toalPolygonCompleteRef.current = true;
                toal.polygon.current = L.polygon(initialToalPolygonPoints, {
                    color: toalColors.stroke,
                    fillColor: toalColors.stroke,
                    fillOpacity: 0.12,
                    weight: 2.5,
                    stroke: true,
                }).addTo(map);
            }

            if (emergencyMode === 'polygon' && initialEmergencyPolygonPoints.length >= 3) {
                emergencyPolygonCompleteRef.current = true;
                emg.polygon.current = L.polygon(initialEmergencyPolygonPoints, {
                    color: emgColors.stroke,
                    fillColor: emgColors.stroke,
                    fillOpacity: 0.12,
                    weight: 2.5,
                    stroke: true,
                });
                if (showEmergency) {
                    emg.polygon.current.addTo(map);
                }
            }

            // Map click — dispatch to active boundary
            map.on('click', (e: any) => {
                if (readOnly) return;
                const { lat, lng } = e.latlng;
                const active = activeBoundaryRef.current;
                const mode = active === 'toal' ? toalModeRef.current : emergencyModeRef.current;
                const done = active === 'toal' ? toalPolygonCompleteRef.current : emergencyPolygonCompleteRef.current;
                const refs = active === 'toal' ? toal : emg;
                const ptsRef = active === 'toal' ? toalPtsRef : emergencyPtsRef;

                if (mode === 'circle') {
                    onCenterChange({ lat, lng });
                    refs.marker.current?.setLatLng([lat, lng]);
                    refs.circle.current?.setLatLng([lat, lng]);
                } else if (mode === 'polygon' && !done) {
                    const pts: [number, number][] = [...ptsRef.current, [lat, lng]];
                    ptsRef.current = pts;

                    const color = active === 'toal' ? BOUNDARY_COLORS.toal.stroke : BOUNDARY_COLORS.emergency.stroke;
                    const vertexIcon = makeVertexIcon(L, color);
                    const vm = L.marker([lat, lng], { icon: vertexIcon }).addTo(map);
                    refs.pointMarkers.current.push(vm);

                    if (refs.polyline.current && map.hasLayer(refs.polyline.current)) {
                        map.removeLayer(refs.polyline.current);
                    }
                    if (pts.length > 1) {
                        refs.polyline.current = L.polyline(pts, {
                            color,
                            weight: 2,
                            dashArray: '6 4',
                        }).addTo(map);
                    }

                    if (active === 'toal') {
                        setToalPolygonPoints([...pts]);
                        onToalPolygonChange(pts);
                    } else {
                        setEmergencyPolygonPoints([...pts]);
                        onEmergencyPolygonChange(pts);
                    }
                }
            });
        });

        return () => {
            mapInstanceRef.current?.remove();
            mapInstanceRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Show/hide emergency layer ─────────────────────────────────────────────

    React.useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (showEmergency) {
            if (emergencyModeRef.current === 'circle') {
                emg.circle.current?.addTo(map);
                emg.marker.current?.addTo(map);
            } else if (emg.polygon.current) {
                emg.polygon.current?.addTo(map);
            }
        } else {
            if (emg.circle.current && map.hasLayer(emg.circle.current)) map.removeLayer(emg.circle.current);
            if (emg.marker.current && map.hasLayer(emg.marker.current)) map.removeLayer(emg.marker.current);
            if (emg.polygon.current && map.hasLayer(emg.polygon.current)) map.removeLayer(emg.polygon.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showEmergency]);

    // ── Geometry mode switches (TOAL) ─────────────────────────────────────────

    React.useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (toalMode === 'circle') {
            toal.circle.current?.addTo(map);
            toal.marker.current?.addTo(map);
            map.getContainer().style.cursor = '';
            clearDrawing(map, toal, toalPtsRef, setToalPolygonPoints, setToalPolygonComplete, toalPolygonCompleteRef, onToalPolygonChange);
        } else {
            if (toal.circle.current && map.hasLayer(toal.circle.current)) map.removeLayer(toal.circle.current);
            if (toal.marker.current && map.hasLayer(toal.marker.current)) map.removeLayer(toal.marker.current);
            if (activeBoundaryRef.current === 'toal' && !readOnly) map.getContainer().style.cursor = 'crosshair';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toalMode]);

    // ── Geometry mode switches (Emergency) ────────────────────────────────────

    React.useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !showEmergency) return;
        if (emergencyMode === 'circle') {
            emg.circle.current?.addTo(map);
            emg.marker.current?.addTo(map);
            if (activeBoundaryRef.current === 'emergency') map.getContainer().style.cursor = '';
            clearDrawing(map, emg, emergencyPtsRef, setEmergencyPolygonPoints, setEmergencyPolygonComplete, emergencyPolygonCompleteRef, onEmergencyPolygonChange);
        } else {
            if (emg.circle.current && map.hasLayer(emg.circle.current)) map.removeLayer(emg.circle.current);
            if (emg.marker.current && map.hasLayer(emg.marker.current)) map.removeLayer(emg.marker.current);
            if (activeBoundaryRef.current === 'emergency' && !readOnly) map.getContainer().style.cursor = 'crosshair';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emergencyMode, showEmergency]);

    // ── Active boundary switch → update cursor ────────────────────────────────

    React.useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const activeMode = activeBoundary === 'toal' ? toalMode : emergencyMode;
        map.getContainer().style.cursor = (activeMode === 'polygon' && !readOnly) ? 'crosshair' : '';
    }, [activeBoundary, toalMode, emergencyMode, readOnly]);

    // ── Satellite toggle ──────────────────────────────────────────────────────

    React.useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (isSatellite) {
            map.removeLayer(streetLayerRef.current);
            satelliteLayerRef.current?.addTo(map);
            labelsLayerRef.current?.addTo(map);
        } else {
            map.removeLayer(satelliteLayerRef.current);
            map.removeLayer(labelsLayerRef.current);
            streetLayerRef.current?.addTo(map);
        }
    }, [isSatellite]);

    // ── TOAL radius sync ──────────────────────────────────────────────────────

    React.useEffect(() => {
        if (toal.circle.current) toal.circle.current.setRadius(toalRadius);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toalRadius]);

    // ── Emergency radius sync ─────────────────────────────────────────────────

    React.useEffect(() => {
        if (emg.circle.current) emg.circle.current.setRadius(emergencyRadius);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emergencyRadius]);

    // ── Pan to center ─────────────────────────────────────────────────────────

    React.useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        map.setView([initialCenter.lat, initialCenter.lng], 16, { animate: true });
        toal.circle.current?.setLatLng([initialCenter.lat, initialCenter.lng]);
        toal.marker.current?.setLatLng([initialCenter.lat, initialCenter.lng]);
        emg.circle.current?.setLatLng([initialCenter.lat, initialCenter.lng]);
        emg.marker.current?.setLatLng([initialCenter.lat, initialCenter.lng]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCenter.lat, initialCenter.lng]);

    // ── Polygon actions ───────────────────────────────────────────────────────

    const getActive = () => activeBoundaryRef.current === 'toal'
        ? { refs: toal, ptsRef: toalPtsRef, setComplete: setToalPolygonComplete, completeRef: toalPolygonCompleteRef, setPts: setToalPolygonPoints, notify: onToalPolygonChange, color: BOUNDARY_COLORS.toal.stroke }
        : { refs: emg, ptsRef: emergencyPtsRef, setComplete: setEmergencyPolygonComplete, completeRef: emergencyPolygonCompleteRef, setPts: setEmergencyPolygonPoints, notify: onEmergencyPolygonChange, color: BOUNDARY_COLORS.emergency.stroke };

    const finishPolygon = () => {
        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (!map || !L) return;
        const { refs, ptsRef, setComplete, completeRef, setPts, notify, color } = getActive();
        const pts = ptsRef.current;
        if (pts.length < 3) return;

        if (refs.polyline.current && map.hasLayer(refs.polyline.current)) map.removeLayer(refs.polyline.current);
        refs.polyline.current = null;

        refs.polygon.current = L.polygon(pts, {
            color,
            fillColor: color,
            fillOpacity: 0.12,
            weight: 2.5,
            stroke: true,
        }).addTo(map);

        completeRef.current = true;
        setComplete(true);
        setPts([...pts]);
        notify(pts);
    };

    const undoLastPoint = () => {
        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (!map || !L) return;
        const { refs, ptsRef, setPts, notify, color } = getActive();
        if (ptsRef.current.length === 0) return;

        const lastMarker = refs.pointMarkers.current.pop();
        if (lastMarker && map.hasLayer(lastMarker)) map.removeLayer(lastMarker);

        const pts: [number, number][] = ptsRef.current.slice(0, -1);
        ptsRef.current = pts;
        setPts([...pts]);

        if (refs.polyline.current && map.hasLayer(refs.polyline.current)) map.removeLayer(refs.polyline.current);
        refs.polyline.current = null;

        if (pts.length > 1) {
            refs.polyline.current = L.polyline(pts, { color, weight: 2, dashArray: '6 4' }).addTo(map);
        }
        notify(pts);
    };

    const resetPolygon = () => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const { refs, ptsRef, setComplete, completeRef, setPts, notify } = getActive();
        clearDrawing(map, refs, ptsRef, setPts, setComplete, completeRef, notify);
    };

    return {
        isSatellite, setIsSatellite,
        finishPolygon, undoLastPoint, resetPolygon,
        toalPolygonPoints, toalPolygonComplete,
        emergencyPolygonPoints, emergencyPolygonComplete,
    };
}

// ─── Pure helpers (not hooks) ─────────────────────────────────────────────────

function injectLeafletStyles() {
    if (document.getElementById('leaflet-ping-kf')) return;
    const style = document.createElement('style');
    style.id = 'leaflet-ping-kf';
    style.textContent = `
        @keyframes leafletPing {
            0% { transform: scale(1); opacity: 0.7; }
            75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-marker-ping { animation: leafletPing 1.6s cubic-bezier(0,0,0.2,1) infinite; }
        .custom-div-icon, .vertex-icon { background: none !important; border: none !important; }
    `;
    document.head.appendChild(style);
}

function makeMarkerIcon(L: any, borderColor: string, pingColor: string) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                <div class="leaflet-marker-ping" style="position:absolute;width:24px;height:24px;border-radius:50%;background:${pingColor};"></div>
                <div style="width:14px;height:14px;border-radius:50%;border:3px solid ${borderColor};background:#ffffff;box-shadow:0 2px 10px rgba(0,0,0,0.5);position:relative;z-index:2;"></div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
}

function makeVertexIcon(L: any, borderColor: string) {
    return L.divIcon({
        className: 'vertex-icon',
        html: `<div style="width:10px;height:10px;border-radius:50%;border:2.5px solid ${borderColor};background:#ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
    });
}

function clearDrawing(
    map: any,
    refs: BoundaryRefs,
    ptsRef: React.MutableRefObject<[number, number][]>,
    setPts: (pts: [number, number][]) => void,
    setComplete: (v: boolean) => void,
    completeRef: React.MutableRefObject<boolean>,
    notify: (pts: [number, number][]) => void,
) {
    if (refs.polyline.current && map.hasLayer(refs.polyline.current)) map.removeLayer(refs.polyline.current);
    if (refs.polygon.current && map.hasLayer(refs.polygon.current)) map.removeLayer(refs.polygon.current);
    refs.pointMarkers.current.forEach(m => { if (map.hasLayer(m)) map.removeLayer(m); });
    refs.polyline.current = null;
    refs.polygon.current = null;
    refs.pointMarkers.current = [];
    ptsRef.current = [];
    setPts([]);
    completeRef.current = false;
    setComplete(false);
    notify([]);
}
