import { useEffect, useRef, useState } from 'react';
import type { GeometryType } from '../types';
import L from 'leaflet';
import { loadLeafletCSS } from '../utils/leafletLoader';
import { Map, Satellite } from 'lucide-react';

interface ReadOnlySiteMapProps {
    geometry: {
        type: GeometryType;
        center?: { lat: number; lng: number };
        radius?: number;
        points?: { lat: number; lng: number }[];
    };
    clzGeometry?: {
        type: GeometryType;
        center?: { lat: number; lng: number };
        radius?: number;
        points?: { lat: number; lng: number }[];
    };
    highlightMode?: 'toal' | 'clz' | 'both';
    showLegend?: boolean;
}

export function ReadOnlySiteMap({
    geometry,
    clzGeometry,
    highlightMode,
    showLegend,
}: ReadOnlySiteMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const streetLayerRef = useRef<L.TileLayer | null>(null);
    const satelliteLayerRef = useRef<L.TileLayer | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [viewMode, setViewMode] = useState<'street' | 'satellite'>('street');

    // Calculate center for polygon
    const displayCenter =
        (geometry && geometry.center) ||
        (geometry && geometry.points && geometry.points.length > 0
            ? {
                  lat: geometry.points.reduce((sum, p) => sum + p.lat, 0) / geometry.points.length,
                  lng: geometry.points.reduce((sum, p) => sum + p.lng, 0) / geometry.points.length,
              }
            : clzGeometry && clzGeometry.center
              ? clzGeometry.center
              : { lat: 51.5074, lng: -0.1278 });

    // Load Leaflet CSS once globally
    useEffect(() => {
        loadLeafletCSS().then(() => setMapReady(true));
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current || !mapReady || mapRef.current) return;

        // Log geometry data for debugging
        console.log('ReadOnlySiteMap - TOAL Geometry:', geometry);
        console.log('ReadOnlySiteMap - CLZ Geometry:', clzGeometry);
        console.log('ReadOnlySiteMap - Highlight Mode:', highlightMode);

        // Create map
        const map = L.map(mapContainerRef.current, {
            center: [displayCenter.lat, displayCenter.lng],
            zoom: 17,
            zoomControl: true,
            dragging: true,
            scrollWheelZoom: true,
            zoomAnimation: false, // Disable zoom animation to prevent timing issues
            fadeAnimation: false, // Disable fade animation
            markerZoomAnimation: false, // Disable marker zoom animation
        });

        // Add street view layer
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        });

        // Add satellite layer
        const satelliteLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: 'Tiles © Esri',
                maxZoom: 19,
            }
        );

        // Start with street view
        streetLayer.addTo(map);
        streetLayerRef.current = streetLayer;
        satelliteLayerRef.current = satelliteLayer;

        // Fix Leaflet icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        mapRef.current = map;

        const mode = highlightMode || 'both';
        const allLayers: L.Layer[] = [];

        // NO MORE DONUT - Show full CLZ geometry when CLZ mode is selected
        if ((mode === 'clz' || mode === 'both') && clzGeometry) {
            if (clzGeometry.type === 'circle' && clzGeometry.center && clzGeometry.radius) {
                console.log('Drawing full CLZ circle:', clzGeometry.center, clzGeometry.radius);
                const circle = L.circle([clzGeometry.center.lat, clzGeometry.center.lng], {
                    radius: clzGeometry.radius,
                    color: '#f59e0b',
                    fillColor: '#fbbf24',
                    fillOpacity: mode === 'clz' ? 0.35 : 0.25,
                    weight: mode === 'clz' ? 4 : 2,
                    dashArray: mode === 'clz' ? undefined : '10, 5',
                }).addTo(map);
                allLayers.push(circle);

                // Add center marker for CLZ
                L.marker([clzGeometry.center.lat, clzGeometry.center.lng], {
                    icon: L.divIcon({
                        className: 'custom-div-icon',
                        html: '<div style="background-color: #f59e0b; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                    }),
                }).addTo(map);
            } else if (
                clzGeometry.type === 'polygon' &&
                clzGeometry.points &&
                clzGeometry.points.length >= 3
            ) {
                console.log('Drawing full CLZ polygon:', clzGeometry.points.length, 'points');
                const polygon = L.polygon(
                    clzGeometry.points.map(p => [p.lat, p.lng]),
                    {
                        color: '#f59e0b',
                        fillColor: '#fbbf24',
                        fillOpacity: mode === 'clz' ? 0.35 : 0.25,
                        weight: mode === 'clz' ? 4 : 2,
                        dashArray: mode === 'clz' ? undefined : '10, 5',
                    }
                ).addTo(map);
                allLayers.push(polygon);
            }
        }

        // Add TOAL geometry when TOAL mode is selected
        if ((mode === 'toal' || mode === 'both') && geometry && geometry.type === 'circle') {
            if (geometry.center && geometry.radius) {
                console.log('Drawing TOAL circle:', geometry.center, geometry.radius);
                const circle = L.circle([geometry.center.lat, geometry.center.lng], {
                    radius: geometry.radius,
                    color: '#0047FF',
                    fillColor: '#0047FF',
                    fillOpacity: mode === 'toal' ? 0.35 : 0.25,
                    weight: mode === 'toal' ? 4 : 2,
                    dashArray: mode === 'toal' ? undefined : '10, 5',
                }).addTo(map);
                allLayers.push(circle);

                // Add center marker for TOAL
                L.marker([geometry.center.lat, geometry.center.lng], {
                    icon: L.divIcon({
                        className: 'custom-div-icon',
                        html: '<div style="background-color: #0047FF; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                    }),
                }).addTo(map);
            }
        } else if (
            (mode === 'toal' || mode === 'both') &&
            geometry &&
            geometry.type === 'polygon'
        ) {
            if (geometry.points && geometry.points.length >= 3) {
                console.log('Drawing TOAL polygon:', geometry.points.length, 'points');
                const polygon = L.polygon(
                    geometry.points.map(p => [p.lat, p.lng]),
                    {
                        color: '#0047FF',
                        fillColor: '#0047FF',
                        fillOpacity: mode === 'toal' ? 0.35 : 0.25,
                        weight: mode === 'toal' ? 4 : 2,
                        dashArray: mode === 'toal' ? undefined : '10, 5',
                    }
                ).addTo(map);
                allLayers.push(polygon);
            }
        }

        console.log('Total layers added:', allLayers.length);

        // Fit bounds to show all layers with a slight delay to ensure map is ready
        if (allLayers.length > 0) {
            setTimeout(() => {
                try {
                    if (mapRef.current) {
                        const group = L.featureGroup(allLayers);
                        mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
                    }
                } catch (error) {
                    console.error('Error fitting bounds:', error);
                }
            }, 100);
        }

        return () => {
            try {
                if (mapRef.current) {
                    // Stop any ongoing animations
                    mapRef.current.stop();
                    // Remove the map
                    mapRef.current.remove();
                    mapRef.current = null;
                }
            } catch (error) {
                console.error('Error removing map:', error);
                mapRef.current = null;
            }
        };
    }, [geometry, clzGeometry, highlightMode, mapReady, displayCenter]);

    // Toggle between street and satellite view
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

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full bg-gray-100" />

            {/* View Mode Toggle */}
            <button
                onClick={toggleViewMode}
                className="absolute top-4 left-4 z-[1000] flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 rounded-lg shadow-md transition-colors text-sm border border-gray-200"
            >
                {viewMode === 'street' ? (
                    <>
                        <Satellite className="size-4" />
                        <span>Satellite</span>
                    </>
                ) : (
                    <>
                        <Map className="size-4" />
                        <span>Street</span>
                    </>
                )}
            </button>

            {/* Legend */}
            {showLegend && (
                <div className="absolute bottom-4 right-4 z-[1000] bg-white rounded-xl shadow-lg p-4 border border-slate-100 min-w-[140px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
                        Map Legend
                    </p>
                    <div className="space-y-3">
                        {(highlightMode === 'toal' || highlightMode === 'both' || !highlightMode) &&
                            geometry && (
                                <div className="flex items-center gap-3">
                                    <div className="size-4 rounded-full bg-blue-600 border-2 border-white shadow-sm ring-1 ring-blue-600/20"></div>
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                        TOAL Zone
                                    </span>
                                </div>
                            )}
                        {(highlightMode === 'clz' || highlightMode === 'both' || !highlightMode) &&
                            clzGeometry && (
                                <div className="flex items-center gap-2">
                                    <div className="size-4 rounded-full bg-[#F59E0B] border-2 border-white shadow-sm ring-1 ring-[#F59E0B]/20"></div>
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                        Emergency Zone
                                    </span>
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
}
