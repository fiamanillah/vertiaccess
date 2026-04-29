import { useEffect, useRef, useState } from 'react';
import type { GeometryType } from '../types';
import { X, Pencil, Map, Satellite, Layers, Globe } from 'lucide-react';
import L from 'leaflet';
import { loadLeafletCSS } from '../utils/leafletLoader';

interface SiteMapProps {
    geometryType: GeometryType;
    center: { lat: number; lng: number };
    radius: number;
    polygonPoints: { lat: number; lng: number }[];
    onCenterChange: (center: { lat: number; lng: number }) => void;
    onPolygonPointsChange: (points: { lat: number; lng: number }[]) => void;
    clzEnabled?: boolean;
    clzCenter?: { lat: number; lng: number };
    clzPolygonPoints?: { lat: number; lng: number }[];
    onClzPolygonPointsChange?: (points: { lat: number; lng: number }[]) => void;
    drawingMode?: 'toal' | 'emergency';
    clzRadius?: number;
    readonly?: boolean;
    clzOnly?: boolean;
    siteCategory?: string;
}

export function SiteMap({
    geometryType,
    center,
    radius,
    polygonPoints,
    onCenterChange,
    onPolygonPointsChange,
    clzEnabled,
    clzCenter,
    clzPolygonPoints,
    onClzPolygonPointsChange,
    drawingMode,
    clzRadius,
    readonly,
    clzOnly,
    siteCategory,
}: SiteMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const toalLayerRef = useRef<L.Circle | L.Polygon | null>(null);
    const clzLayerRef = useRef<L.Circle | L.Polygon | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const tempPolygonMarkersRef = useRef<L.Marker[]>([]);
    const vertexMarkersRef = useRef<L.Marker[]>([]);
    const tempPolygonLinesRef = useRef<L.Polyline | null>(null);
    const streetLayerRef = useRef<L.TileLayer | null>(null);
    const satelliteLayerRef = useRef<L.TileLayer | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedDrawingMode, setSelectedDrawingMode] = useState<'toal' | 'emergency' | null>(
        null
    );
    const [tempPolygonPoints, setTempPolygonPoints] = useState<{ lat: number; lng: number }[]>([]);
    const [mapReady, setMapReady] = useState(false);
    const [viewMode, setViewMode] = useState<'street' | 'satellite'>('street');
    const [activeCircleMode, setActiveCircleMode] = useState<'toal' | 'emergency' | null>(null);

    useEffect(() => {
        loadLeafletCSS().then(() => setMapReady(true));
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current || !mapReady) return;

        const map = L.map(mapContainerRef.current, {
            center: [center.lat, center.lng],
            zoom: 17,
            zoomControl: false, // We'll handle custom controls if needed or use default elsewhere
        });

        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19,
        });

        const satelliteLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: 'Tiles © Esri',
                maxZoom: 19,
            }
        );

        streetLayer.addTo(map);
        streetLayerRef.current = streetLayer;
        satelliteLayerRef.current = satelliteLayer;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [mapReady]);

    useEffect(() => {
        if (mapRef.current && center.lat && center.lng) {
            if (readonly) {
                // In readonly mode, zoom to show the geometry properly
                mapRef.current.setView([center.lat, center.lng], 16);
            } else {
                mapRef.current.setView([center.lat, center.lng], mapRef.current.getZoom());
            }
        }
    }, [center.lat, center.lng, readonly]);

    const toggleViewMode = () => {
        if (!mapRef.current || !streetLayerRef.current || !satelliteLayerRef.current) return;

        if (viewMode === 'street') {
            mapRef.current.removeLayer(streetLayerRef.current);
            mapRef.current.addLayer(satelliteLayerRef.current);
            setViewMode('satellite');
        } else {
            mapRef.current.removeLayer(satelliteLayerRef.current);
            mapRef.current.addLayer(streetLayerRef.current);
            setViewMode('street');
        }
    };

    // Clear temp drawing when switching modes
    useEffect(() => {
        setTempPolygonPoints([]);
    }, [drawingMode]);

    // Handle map clicks for drawing
    useEffect(() => {
        if (!mapRef.current || readonly || !mapReady) return;

        // Add a small delay to ensure map is fully initialized
        const timer = setTimeout(() => {
            if (!mapRef.current) return;

            const handleMapClick = (e: L.LeafletMouseEvent) => {
                console.log('Map clicked:', {
                    lat: e.latlng.lat,
                    lng: e.latlng.lng,
                    geometryType,
                    mapReady,
                });
                if (geometryType === 'circle') {
                    console.log('Updating center to:', {
                        lat: e.latlng.lat,
                        lng: e.latlng.lng,
                    });
                    onCenterChange({ lat: e.latlng.lat, lng: e.latlng.lng });
                } else {
                    const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
                    setTempPolygonPoints(prev => [...prev, newPoint]);
                }
            };

            mapRef.current.on('click', handleMapClick);
            console.log('Click handler attached to map');
        }, 100); // 100ms delay

        return () => {
            clearTimeout(timer);
            if (mapRef.current) {
                mapRef.current.off('click');
                console.log('Click handler removed from map');
            }
        };
    }, [geometryType, readonly, onCenterChange, mapReady]);

    // Unified rendering effect for all layers
    useEffect(() => {
        if (!mapRef.current || !mapReady) return;

        console.log('Rendering layers:', {
            geometryType,
            center,
            radius,
            readonly,
            clzOnly,
            mapReady,
        });

        // Add a small delay for readonly mode to ensure map is fully ready
        const timer = setTimeout(
            () => {
                if (!mapRef.current) return;

                // Force Leaflet to recalculate container bounds, fixing modal animation issues
                mapRef.current.invalidateSize();

                // Clear all vector layers and markers
                if (toalLayerRef.current) toalLayerRef.current.remove();
                if (clzLayerRef.current) clzLayerRef.current.remove();
                if (markerRef.current) markerRef.current.remove();
                if (tempPolygonLinesRef.current) tempPolygonLinesRef.current.remove();
                vertexMarkersRef.current.forEach(m => m.remove());
                vertexMarkersRef.current = [];
                tempPolygonMarkersRef.current.forEach(m => m.remove());
                tempPolygonMarkersRef.current = [];

                // 1. Render TOAL (Finished)
                if (!clzOnly) {
                    if (geometryType === 'circle' && center.lat && center.lng && radius > 0) {
                        console.log('Rendering circle:', {
                            center,
                            radius,
                            mapExists: !!mapRef.current,
                        });
                        toalLayerRef.current = L.circle([center.lat, center.lng], {
                            radius: radius,
                            color: '#0047FF',
                            fillColor: '#0047FF',
                            fillOpacity: 0.2,
                            weight: 2,
                        }).addTo(mapRef.current);
                        console.log('Circle added to map');

                        markerRef.current = L.marker([center.lat, center.lng], {
                            draggable: !readonly,
                            icon: L.divIcon({
                                className: 'custom-div-icon',
                                html: '<div style="background-color: #0047FF; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                                iconSize: [14, 14],
                                iconAnchor: [7, 7],
                            }),
                        }).addTo(mapRef.current);
                        console.log('Marker added to map');

                        markerRef.current.on('dragend', e => {
                            const newPos = e.target.getLatLng();
                            onCenterChange({ lat: newPos.lat, lng: newPos.lng });
                        });
                    } else if (geometryType === 'polygon' && polygonPoints.length >= 3) {
                        toalLayerRef.current = L.polygon(
                            polygonPoints.map(p => [p.lat, p.lng]),
                            {
                                color: '#0047FF',
                                fillColor: '#0047FF',
                                fillOpacity: 0.2,
                                weight: 2,
                            }
                        ).addTo(mapRef.current);

                        // Only show vertices if we are in TOAL drawing mode
                        if (!readonly && drawingMode === 'toal') {
                            polygonPoints.forEach((p, idx) => {
                                const vMarker = L.marker([p.lat, p.lng], {
                                    draggable: true,
                                    icon: L.divIcon({
                                        className: 'custom-div-icon',
                                        html: '<div style="background-color: #0047FF; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
                                        iconSize: [10, 10],
                                        iconAnchor: [5, 5],
                                    }),
                                }).addTo(mapRef.current!);

                                vMarker.on('dragend', e => {
                                    const newPos = e.target.getLatLng();
                                    const newPoints = [...polygonPoints];
                                    newPoints[idx] = { lat: newPos.lat, lng: newPos.lng };
                                    onPolygonPointsChange(newPoints);
                                });
                                vertexMarkersRef.current.push(vMarker);
                            });
                        }
                    }
                }

                // 2. Render CLZ (Finished)
                if (clzEnabled || clzOnly) {
                    if (geometryType === 'circle' && (clzRadius || 0) > 0) {
                        clzLayerRef.current = L.circle(
                            [clzCenter?.lat || center.lat, clzCenter?.lng || center.lng],
                            {
                                radius: clzRadius,
                                color: '#F59E0B',
                                fillColor: '#F59E0B',
                                fillOpacity: 0.1,
                                weight: 2,
                                dashArray: '5, 5',
                            }
                        ).addTo(mapRef.current);
                    } else if (
                        geometryType === 'polygon' &&
                        clzPolygonPoints &&
                        clzPolygonPoints.length >= 3
                    ) {
                        clzLayerRef.current = L.polygon(
                            clzPolygonPoints.map(p => [p.lat, p.lng]),
                            {
                                color: '#F59E0B',
                                fillColor: '#F59E0B',
                                fillOpacity: 0.1,
                                weight: 2,
                                dashArray: '5, 5',
                            }
                        ).addTo(mapRef.current);

                        // Only show vertices if we are in Emergency drawing mode
                        if (!readonly && drawingMode === 'emergency') {
                            clzPolygonPoints.forEach((p, idx) => {
                                const vMarker = L.marker([p.lat, p.lng], {
                                    draggable: true,
                                    icon: L.divIcon({
                                        className: 'custom-div-icon',
                                        html: '<div style="background-color: #F59E0B; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
                                        iconSize: [10, 10],
                                        iconAnchor: [5, 5],
                                    }),
                                }).addTo(mapRef.current!);

                                vMarker.on('dragend', e => {
                                    const newPos = e.target.getLatLng();
                                    const newPoints = [...clzPolygonPoints];
                                    newPoints[idx] = { lat: newPos.lat, lng: newPos.lng };
                                    onClzPolygonPointsChange?.(newPoints);
                                });
                                vertexMarkersRef.current.push(vMarker);
                            });
                        }
                    }
                }

                // 3. Render Active Drawing (Temp)
                if (!readonly && geometryType === 'polygon' && tempPolygonPoints.length > 0) {
                    tempPolygonPoints.forEach(p => {
                        const marker = L.marker([p.lat, p.lng], {
                            icon: L.divIcon({
                                className: 'custom-div-icon',
                                html: `<div style="background-color: ${drawingMode === 'emergency' ? '#F59E0B' : '#0047FF'}; width: 8px; height: 8px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.5);"></div>`,
                                iconSize: [8, 8],
                                iconAnchor: [4, 4],
                            }),
                        }).addTo(mapRef.current!);
                        tempPolygonMarkersRef.current.push(marker);
                    });

                    if (tempPolygonPoints.length >= 1) {
                        const linePoints = tempPolygonPoints.map(
                            p => [p.lat, p.lng] as [number, number]
                        );
                        tempPolygonLinesRef.current = L.polyline(linePoints, {
                            color: drawingMode === 'emergency' ? '#F59E0B' : '#0047FF',
                            weight: 3,
                            dashArray: '5, 5',
                        }).addTo(mapRef.current!);
                    }
                }

                if (
                    (readonly || geometryType === 'circle') &&
                    (toalLayerRef.current || clzLayerRef.current)
                ) {
                    const visibleLayers: Array<L.Circle | L.Polygon> = [];
                    if (toalLayerRef.current) visibleLayers.push(toalLayerRef.current);
                    if (clzLayerRef.current) visibleLayers.push(clzLayerRef.current);

                    if (visibleLayers.length > 0) {
                        const combinedBounds = L.featureGroup(visibleLayers).getBounds();
                        if (combinedBounds.isValid()) {
                            // Don't fit bounds if we're actively drawing a polygon
                            if (geometryType === 'circle' || readonly) {
                                mapRef.current.fitBounds(combinedBounds, { padding: [40, 40] });
                            }
                        }
                    }
                }
            },
            readonly ? 500 : 0
        ); // Longer delay for readonly mode

        return () => {
            clearTimeout(timer);
        };
    }, [
        geometryType,
        center,
        radius,
        polygonPoints,
        clzRadius,
        clzPolygonPoints,
        clzEnabled,
        clzOnly,
        readonly,
        drawingMode,
        tempPolygonPoints,
        mapReady,
    ]);

    const handleClearPolygon = () => {
        if (tempPolygonPoints.length > 0) {
            setTempPolygonPoints([]);
        } else {
            if (drawingMode === 'emergency') {
                onClzPolygonPointsChange?.([]);
            } else {
                onPolygonPointsChange([]);
            }
        }
    };

    const handleFinishPolygon = () => {
        if (tempPolygonPoints.length < 3) return;

        if (drawingMode === 'emergency') {
            onClzPolygonPointsChange?.(tempPolygonPoints);
        } else {
            onPolygonPointsChange(tempPolygonPoints);
        }
        setTempPolygonPoints([]);
    };

    const currentPoints = drawingMode === 'emergency' ? clzPolygonPoints : polygonPoints;
    const hasExistingPoints = (currentPoints?.length || 0) >= 3;

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <div
                ref={mapContainerRef}
                className="w-full h-full bg-slate-50"
                style={{ cursor: readonly ? 'default' : 'crosshair' }}
            />

            {/* Drawing Controls - Top Center Pill */}
            {!readonly && geometryType === 'polygon' && (
                <div className="absolute top-4 right-0 z-[1001] flex items-center bg-white p-1 rounded-xl shadow-2xl border border-slate-200 divide-x divide-slate-100">
                    <button
                        onClick={handleClearPolygon}
                        disabled={tempPolygonPoints.length === 0 && !hasExistingPoints}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
                    >
                        <X className="size-3" />
                        Clear
                    </button>
                    <button
                        onClick={handleFinishPolygon}
                        disabled={tempPolygonPoints.length < 3}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-md uppercase tracking-widest"
                    >
                        <Pencil className="size-3" />
                        Finish Polygon ({tempPolygonPoints.length})
                    </button>
                </div>
            )}

            {/* Floating View Toggle - Top Right */}
            <button
                onClick={toggleViewMode}
                className="absolute top-4 right-4 z-[1000] flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 transition-all font-bold text-[10px] uppercase tracking-widest text-slate-600 hover:bg-white"
            >
                <Globe className="size-3.5 text-blue-600" />
                <span>{viewMode === 'street' ? 'Satellite View' : 'Street View'}</span>
            </button>

            {/* Map Legend Overlay - Bottom Right */}
            <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2 p-3 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl min-w-32.5">
                <div className="flex items-center gap-2.5">
                    <div className="size-2.5 rounded-full border border-blue-600 bg-blue-500/10 shadow-[0_0_0_1px_rgba(0,71,255,0.2)]" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        TOAL Zone
                    </span>
                </div>
                {(clzEnabled || clzOnly) && (
                    <div className="flex items-center gap-2.5">
                        <div className="size-2.5 rounded-full border border-dashed border-amber-500 bg-amber-500/10 shadow-[0_0_0_1px_rgba(245,158,11,0.2)]" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            Emergency & Recovery Zone
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
