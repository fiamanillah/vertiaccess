import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { loadLeafletCSS } from '../utils/leafletLoader';

interface Geometry {
    type: 'circle' | 'polygon';
    center?: { lat: number; lng: number };
    radius?: number;
    points?: { lat: number; lng: number }[];
}

interface CertificateMapSnapshotProps {
    toalGeometry: Geometry;
    clzGeometry?: Geometry;
    siteName: string;
}

export function CertificateMapSnapshot({
    toalGeometry,
    clzGeometry,
    siteName,
}: CertificateMapSnapshotProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        const initMap = async () => {
            // Load Leaflet CSS
            await loadLeafletCSS();

            if (!mapContainerRef.current || mapRef.current) return;

            // Determine center point based on TOAL geometry
            let center: [number, number];
            if (toalGeometry.type === 'circle' && toalGeometry.center) {
                center = [toalGeometry.center.lat, toalGeometry.center.lng];
            } else if (
                toalGeometry.type === 'polygon' &&
                toalGeometry.points &&
                toalGeometry.points.length > 0
            ) {
                const lats = toalGeometry.points.map(p => p.lat);
                const lngs = toalGeometry.points.map(p => p.lng);
                center = [
                    lats.reduce((a, b) => a + b, 0) / lats.length,
                    lngs.reduce((a, b) => a + b, 0) / lngs.length,
                ];
            } else {
                return;
            }

            // Create map
            const map = L.map(mapContainerRef.current, {
                center,
                zoom: 15,
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false,
                attributionControl: false,
            });

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                crossOrigin: true,
            }).addTo(map);

            // Draw CLZ geometry first (if available) - in amber
            if (clzGeometry) {
                if (clzGeometry.type === 'circle' && clzGeometry.center && clzGeometry.radius) {
                    // Check if CLZ shares the same center as TOAL (donut effect)
                    const isDonut =
                        toalGeometry.type === 'circle' &&
                        toalGeometry.center &&
                        toalGeometry.center.lat === clzGeometry.center.lat &&
                        toalGeometry.center.lng === clzGeometry.center.lng;

                    if (isDonut && toalGeometry.radius) {
                        // Create donut shape using SVG overlay
                        const outerRadius = clzGeometry.radius;
                        const innerRadius = toalGeometry.radius;

                        // Draw outer CLZ circle with no fill
                        L.circle([clzGeometry.center.lat, clzGeometry.center.lng], {
                            radius: outerRadius,
                            color: '#f59e0b',
                            fillColor: '#fbbf24',
                            fillOpacity: 0.2,
                            weight: 2,
                        }).addTo(map);

                        // Draw white circle to create hole (simulating donut)
                        L.circle([clzGeometry.center.lat, clzGeometry.center.lng], {
                            radius: innerRadius,
                            color: 'transparent',
                            fillColor: '#ffffff',
                            fillOpacity: 1,
                            weight: 0,
                        }).addTo(map);
                    } else {
                        // Regular CLZ circle (not a donut)
                        L.circle([clzGeometry.center.lat, clzGeometry.center.lng], {
                            radius: clzGeometry.radius,
                            color: '#f59e0b',
                            fillColor: '#fbbf24',
                            fillOpacity: 0.2,
                            weight: 2,
                        }).addTo(map);
                    }
                } else if (
                    clzGeometry.type === 'polygon' &&
                    clzGeometry.points &&
                    clzGeometry.points.length >= 3
                ) {
                    L.polygon(
                        clzGeometry.points.map(p => [p.lat, p.lng] as [number, number]),
                        {
                            color: '#f59e0b',
                            fillColor: '#fbbf24',
                            fillOpacity: 0.2,
                            weight: 2,
                        }
                    ).addTo(map);
                }
            }

            // Draw TOAL geometry on top - in blue
            if (toalGeometry.type === 'circle' && toalGeometry.center && toalGeometry.radius) {
                L.circle([toalGeometry.center.lat, toalGeometry.center.lng], {
                    radius: toalGeometry.radius,
                    color: '#0047FF',
                    fillColor: '#60A5FA',
                    fillOpacity: 0.4,
                    weight: 3,
                }).addTo(map);

                // Add center marker
                const divIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `
            <div style="width: 24px; height: 24px; background: #4f46e5; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
          `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });
                L.marker([toalGeometry.center.lat, toalGeometry.center.lng], {
                    icon: divIcon,
                }).addTo(map);
            } else if (
                toalGeometry.type === 'polygon' &&
                toalGeometry.points &&
                toalGeometry.points.length >= 3
            ) {
                const polygon = L.polygon(
                    toalGeometry.points.map(p => [p.lat, p.lng] as [number, number]),
                    {
                        color: '#4f46e5',
                        fillColor: '#818cf8',
                        fillOpacity: 0.4,
                        weight: 3,
                    }
                ).addTo(map);

                // Fit bounds to polygon
                map.fitBounds(polygon.getBounds(), { padding: [20, 20] });

                // Add center marker
                const center = polygon.getBounds().getCenter();
                const divIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `
            <div style="width: 24px; height: 24px; background: #4f46e5; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
          `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });
                L.marker([center.lat, center.lng], { icon: divIcon }).addTo(map);
            }

            mapRef.current = map;

            // Force map to resize after a short delay
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        };

        initMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [toalGeometry, clzGeometry]);

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <div className="relative" style={{ height: '300px' }}>
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Map overlay with site info */}
                <div className="absolute top-3 left-3 bg-white bg-opacity-95 px-3 py-2 rounded-lg shadow-md z-[1000] border border-indigo-200">
                    <p className="text-xs font-medium text-indigo-900">📍 {siteName}</p>
                    <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                            <span className="text-xs text-gray-700">TOAL Zone</span>
                        </div>
                        {clzGeometry && (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <span className="text-xs text-gray-700">
                                    Emergency & Recovery Zone
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scale indicator */}
                <div className="absolute bottom-3 right-3 bg-white bg-opacity-95 px-2 py-1 rounded text-xs text-gray-600 z-[1000] border border-gray-300">
                    © OpenStreetMap
                </div>

                {/* North arrow */}
                <div className="absolute top-3 right-3 bg-white bg-opacity-95 rounded-full shadow-md w-10 h-10 flex items-center justify-center z-[1000] border border-gray-300">
                    <div className="relative">
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500"></div>
                        <div className="text-xs font-medium text-gray-700 mt-1">N</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
