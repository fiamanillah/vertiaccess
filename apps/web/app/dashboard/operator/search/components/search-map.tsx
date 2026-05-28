'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';
import type { DetailedSite } from '../../../landowner/sites/schema';
import { BOUNDARY_COLORS, MapCenter } from '@/components/map/map-types';
import { SatelliteToggle } from '@/components/map/map-controls';
import { toast } from 'sonner';
import { Loader2, MapPin, Search } from 'lucide-react';

interface SearchMapProps {
    sites: DetailedSite[];
    center: MapCenter;
    onCenterChange?: (center: MapCenter) => void;
    /** Called when the user pins their location OR when search-as-I-move fires */
    onLocationPin?: (center: MapCenter) => void;
    className?: string;
}

export function SearchMap({ sites, center, onCenterChange, onLocationPin, className }: SearchMapProps) {
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<any>(null);
    const leafletRef = React.useRef<any>(null);
    const userMarkerRef = React.useRef<any>(null);
    const [isSatellite, setIsSatellite] = React.useState(true);
    const satelliteLayerRef = React.useRef<any>(null);
    const streetLayerRef = React.useRef<any>(null);
    const labelsLayerRef = React.useRef<any>(null);

    const [mapBoundsCenter, setMapBoundsCenter] = React.useState<MapCenter>(center);
    const [searchAsIMove, setSearchAsIMove] = React.useState(false);
    const [isLocating, setIsLocating] = React.useState(false);
    const [hasMoved, setHasMoved] = React.useState(false);
    const [userLocation, setUserLocation] = React.useState<MapCenter | null>(null);

    // Keep a ref to searchAsIMove so the moveend handler always sees the latest value
    const searchAsIMoveRef = React.useRef(searchAsIMove);
    React.useEffect(() => {
        searchAsIMoveRef.current = searchAsIMove;
    }, [searchAsIMove]);

    // Keep a ref to onLocationPin
    const onLocationPinRef = React.useRef(onLocationPin);
    React.useEffect(() => {
        onLocationPinRef.current = onLocationPin;
    }, [onLocationPin]);

    // Bootstrap leaflet map
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
                center: [center.lat, center.lng],
                zoom: 13,
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

            map.on('moveend', () => {
                const c = map.getCenter();
                const newCenter = { lat: c.lat, lng: c.lng };
                setMapBoundsCenter(newCenter);
                setHasMoved(true);

                if (searchAsIMoveRef.current) {
                    onLocationPinRef.current?.(newCenter);
                    setHasMoved(false); // reset so "Search this area" doesn't flash
                }
            });

            mapInstanceRef.current = map;
            renderSites(map, L, sites);
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Render sites when they change
    React.useEffect(() => {
        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (!map || !L) return;
        renderSites(map, L, sites);
    }, [sites]);

    // Handle satellite toggle
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

    // Sync / render user location marker when it changes
    React.useEffect(() => {
        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (!map || !L) return;

        // Remove old user marker
        if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
            userMarkerRef.current = null;
        }

        if (!userLocation) return;

        const userIcon = L.divIcon({
            className: 'user-location-icon',
            html: `
                <div style="position:relative;width:28px;height:28px;">
                    <div style="
                        position:absolute;inset:0;border-radius:50%;
                        background:rgba(59,130,246,0.25);
                        animation:userPing 1.8s ease-out infinite;
                    "></div>
                    <div style="
                        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                        width:16px;height:16px;border-radius:50%;
                        background:#3b82f6;border:3px solid #fff;
                        box-shadow:0 2px 8px rgba(59,130,246,0.6);
                    "></div>
                </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
        });

        const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
        marker.bindTooltip('<strong>You are here</strong>', {
            direction: 'top',
            offset: [0, -14],
            className: 'custom-leaflet-tooltip',
        });
        userMarkerRef.current = marker;
    }, [userLocation]);

    const handlePinMyLocation = React.useCallback(() => {
        if (!('geolocation' in navigator)) {
            toast.error('Geolocation is not supported by your browser.');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setIsLocating(false);
                const loc: MapCenter = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserLocation(loc);
                setHasMoved(false);

                // Pan & zoom the map to user location
                const map = mapInstanceRef.current;
                if (map) {
                    map.setView([loc.lat, loc.lng], 14, { animate: true });
                }

                // Trigger a new API search centred on user location
                onLocationPinRef.current?.(loc);
                toast.success('Showing sites near your location');
            },
            (error) => {
                setIsLocating(false);
                if (error.code === error.PERMISSION_DENIED) {
                    toast.error('Location access denied. Please enable it in your browser settings.');
                } else {
                    toast.error('Unable to retrieve your location. Please try again.');
                }
            },
            { timeout: 10000 }
        );
    }, []);

    const handleSearchThisArea = React.useCallback(() => {
        setHasMoved(false);
        onLocationPinRef.current?.(mapBoundsCenter);
    }, [mapBoundsCenter]);

    const renderSites = (map: any, L: any, sitesToRender: DetailedSite[]) => {
        // Clear existing site markers/layers (keep user marker)
        map.eachLayer((layer: any) => {
            if (
                (layer instanceof L.Marker && layer !== userMarkerRef.current) ||
                layer instanceof L.Circle ||
                layer instanceof L.Polygon
            ) {
                map.removeLayer(layer);
            }
        });

        sitesToRender.forEach(site => {
            const isAuto = site.bookingApprovalModel === 'auto';
            const isEmergency = site.siteType === 'emergency';

            // Marker logic
            const color = isAuto ? '#10b981' : '#3b82f6'; // Green for auto, Blue for manual
            const iconText = isEmergency ? 'E' : 'T';
            const markerIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `
                    <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                        <div style="width:28px;height:28px;border-radius:50%;border:3px solid ${color};background:#ffffff;box-shadow:0 2px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:${color};font-weight:bold;font-size:14px;position:relative;z-index:2;">
                            ${iconText}
                        </div>
                    </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });

            const marker = L.marker([site.latitude, site.longitude], { icon: markerIcon }).addTo(map);

            // Tooltip
            const tooltipContent = `
                <div style="padding: 4px; font-family: Inter, sans-serif;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${site.name}</div>
                    <div style="color: #666; font-size: 12px; margin-bottom: 8px;">${site.category} • ${isAuto ? 'Auto-Approval' : 'Manual'}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; font-size: 14px;">£${site.siteType === 'toal' ? site.toalFee : site.emergencyFee}</span>
                        <a href="#" style="color: #5b6cf9; font-size: 12px; font-weight: 500; text-decoration: none;">View Details →</a>
                    </div>
                </div>
            `;
            marker.bindTooltip(tooltipContent, {
                direction: 'top',
                offset: [0, -16],
                className: 'custom-leaflet-tooltip'
            });

            // Boundary rendering
            const renderBoundary = (type: 'toal' | 'emergency') => {
                const geomMode = type === 'toal' ? site.toalGeometryMode : site.emergencyGeometryMode;
                const radius = type === 'toal' ? site.toalRadius : site.emergencyRadius;
                const pts = type === 'toal' ? site.toalPolygonPoints : site.emergencyPolygonPoints;
                const colors = BOUNDARY_COLORS[type];

                if (geomMode === 'circle' && radius) {
                    L.circle([site.latitude, site.longitude], {
                        radius: radius,
                        color: colors.stroke,
                        fillColor: colors.fill,
                        fillOpacity: 0.1,
                        stroke: true,
                        weight: 1.5,
                        dashArray: type === 'emergency' ? '4 4' : '',
                    }).addTo(map);
                } else if (geomMode === 'polygon' && pts && pts.length >= 3) {
                    L.polygon(pts, {
                        color: colors.stroke,
                        fillColor: colors.fill,
                        fillOpacity: 0.1,
                        weight: 1.5,
                        stroke: true,
                        dashArray: type === 'emergency' ? '4 4' : '',
                    }).addTo(map);
                }
            };

            if (site.siteType === 'toal' || !isEmergency) renderBoundary('toal');
            if (site.allowEmergencyLanding || isEmergency) renderBoundary('emergency');
        });
    };

    return (
        <div className={cn('relative w-full h-full flex flex-col', className)}>
            <div
                ref={mapRef}
                className="w-full flex-1 z-0"
                style={{ minHeight: 400 }}
            />

            {/* Top-right: satellite toggle */}
            <div className="absolute top-4 right-4 z-10">
                <SatelliteToggle isSatellite={isSatellite} onToggle={() => setIsSatellite(!isSatellite)} />
            </div>

            {/* Top Center: Search as I move / Search this area */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
                <div className="bg-background/90 backdrop-blur-md shadow-lg border border-border rounded-full px-4 py-2 flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={searchAsIMove}
                            onChange={(e) => {
                                setSearchAsIMove(e.target.checked);
                                if (e.target.checked) setHasMoved(false);
                            }}
                            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-sm font-medium whitespace-nowrap">Search as I move the map</span>
                    </label>
                </div>

                {/* "Search this area" button — appears after panning when search-as-I-move is off */}
                {hasMoved && !searchAsIMove && (
                    <button
                        onClick={handleSearchThisArea}
                        className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 animate-in fade-in slide-in-from-top-1"
                    >
                        <Search className="h-3.5 w-3.5" />
                        Search this area
                    </button>
                )}
            </div>

            {/* Bottom-right: Pin My Location button */}
            <div className="absolute bottom-8 right-4 z-10">
                <button
                    onClick={handlePinMyLocation}
                    disabled={isLocating}
                    title="Pin my location"
                    className={cn(
                        'flex items-center justify-center w-11 h-11 rounded-full bg-background border border-border shadow-lg',
                        'hover:bg-muted/80 active:scale-95 transition-all duration-150',
                        'disabled:opacity-60 disabled:cursor-not-allowed',
                        userLocation && 'border-blue-400 text-blue-500'
                    )}
                >
                    {isLocating ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                        <MapPin className={cn('h-5 w-5', userLocation ? 'text-blue-500 fill-blue-100' : 'text-muted-foreground')} />
                    )}
                </button>
            </div>

            {/* Bottom-left: coordinates */}
            <div className="absolute bottom-6 left-4 z-10 pointer-events-none">
                <Badge
                    variant="secondary"
                    className="text-[10px] font-mono bg-background/90 backdrop-blur-sm border shadow-sm pointer-events-auto"
                >
                    {mapBoundsCenter.lat.toFixed(6)}, {mapBoundsCenter.lng.toFixed(6)}
                </Badge>
            </div>
        </div>
    );
}

function injectLeafletStyles() {
    if (document.getElementById('leaflet-custom-search')) return;
    const style = document.createElement('style');
    style.id = 'leaflet-custom-search';
    style.textContent = `
        .custom-div-icon { background: none !important; border: none !important; }
        .user-location-icon { background: none !important; border: none !important; }
        .custom-leaflet-tooltip {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-radius: 8px;
            padding: 8px;
            color: #0f172a;
        }
        @keyframes userPing {
            0%   { transform: scale(1);   opacity: 0.8; }
            70%  { transform: scale(2.5); opacity: 0; }
            100% { transform: scale(2.5); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}
