'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { DetailedSite } from '../schema';
import { BOUNDARY_COLORS, MapCenter } from '@/components/map/map-types';
import { SatelliteToggle } from '@/components/map/map-controls';
import { useRouter } from 'next/navigation';

interface AssetManagerMapProps {
    sites: DetailedSite[];
    selectedSiteIds: string[];
    focusedSiteId?: string | null;
    focusTrigger?: number;
    onSiteSelect: (siteId: string) => void;
    className?: string;
}

function getSiteBounds(L: any, site: DetailedSite) {
    const latLngs: any[] = [];
    latLngs.push([site.latitude, site.longitude]);
    
    const showToal = site.siteType !== 'emergency';
    const showEmergency = site.siteType === 'emergency' || site.allowEmergencyLanding;

    if (showToal) {
        if (site.toalGeometryMode === 'polygon' && site.toalPolygonPoints && site.toalPolygonPoints.length >= 3) {
            site.toalPolygonPoints.forEach((pt: any) => {
                if (Array.isArray(pt)) {
                    latLngs.push(pt);
                } else if (pt && typeof pt === 'object' && 'lat' in pt && 'lng' in pt) {
                    latLngs.push([pt.lat, pt.lng]);
                }
            });
        } else if (site.toalRadius) {
            const circle = L.circle([site.latitude, site.longitude], { radius: site.toalRadius });
            const bounds = circle.getBounds();
            latLngs.push(bounds.getNorthEast());
            latLngs.push(bounds.getSouthWest());
        }
    }
    
    if (showEmergency) {
        if (site.emergencyGeometryMode === 'polygon' && site.emergencyPolygonPoints && site.emergencyPolygonPoints.length >= 3) {
            site.emergencyPolygonPoints.forEach((pt: any) => {
                if (Array.isArray(pt)) {
                    latLngs.push(pt);
                } else if (pt && typeof pt === 'object' && 'lat' in pt && 'lng' in pt) {
                    latLngs.push([pt.lat, pt.lng]);
                }
            });
        } else if (site.emergencyRadius) {
            const circle = L.circle([site.latitude, site.longitude], { radius: site.emergencyRadius });
            const bounds = circle.getBounds();
            latLngs.push(bounds.getNorthEast());
            latLngs.push(bounds.getSouthWest());
        }
    }
    
    return L.latLngBounds(latLngs);
}

export function AssetManagerMap({
    sites,
    selectedSiteIds,
    focusedSiteId,
    focusTrigger,
    onSiteSelect,
    className,
}: AssetManagerMapProps) {
    const router = useRouter();
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<any>(null);
    const leafletRef = React.useRef<any>(null);

    const [isSatellite, setIsSatellite] = React.useState(false);
    const [currentZoom, setCurrentZoom] = React.useState(10);
    const satelliteLayerRef = React.useRef<any>(null);
    const streetLayerRef = React.useRef<any>(null);
    const labelsLayerRef = React.useRef<any>(null);

    // Bootstrap Leaflet
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

            // Calculate center and zoom based on sites, or default to London
            const firstSite = sites.length > 0 ? sites[0] : null;
            const centerLat = firstSite?.latitude ?? 51.505;
            const centerLng = firstSite?.longitude ?? -0.09;

            const map = L.map(mapRef.current!, {
                center: [centerLat, centerLng],
                zoom: 10,
                zoomControl: true,
            });

            map.on('zoomend', () => {
                setCurrentZoom(map.getZoom());
            });

            satelliteLayerRef.current = L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
            );
            streetLayerRef.current = L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19, className: 'osm-tiles' }
            );
            labelsLayerRef.current = L.tileLayer(
                'https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png',
                { opacity: 0.5, maxZoom: 19 }
            );

            streetLayerRef.current.addTo(map);

            // Fit bounds if there are sites
            if (sites.length > 0) {
                const bounds = L.latLngBounds(sites.map(s => [s.latitude, s.longitude]));
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            }

            mapInstanceRef.current = map;
            renderSites(map, L, sites, selectedSiteIds, map.getZoom());
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sites]);

    // Re-render site markers when selection or zoom changes
    React.useEffect(() => {
        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (!map || !L) return;
        renderSites(map, L, sites, selectedSiteIds, currentZoom);
    }, [selectedSiteIds, sites, currentZoom]);

    // Fly to focused site when it changes
    React.useEffect(() => {
        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (!map || !L || !focusedSiteId) return;

        const site = sites.find(s => s.id === focusedSiteId);
        if (site) {
            const bounds = getSiteBounds(L, site);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
        }
    }, [focusedSiteId, focusTrigger, sites]);

    // Satellite / street tile toggle
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

    // Render site markers
    const renderSites = (map: any, L: any, sitesToRender: DetailedSite[], selected: string[], zoom: number) => {
        // Clear existing markers and shapes except tiles
        map.eachLayer((layer: any) => {
            if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polygon) {
                map.removeLayer(layer);
            }
        });

        // Hide sites if zoomed out too much (e.g. less than 11)
        if (zoom < 11) {
            return;
        }

        // Only show selected sites by default, as requested
        const selectedSites = sitesToRender.filter(s => selected.includes(s.id));
        
        selectedSites.forEach(site => {
            const isSelected = true; // since we only map selected sites now
            const isEmergency = site.siteType === 'emergency';

            const baseColor = isEmergency ? '#ef4444' : 'hsl(var(--primary, 221 83% 53%))';
            const bgColor = isSelected ? baseColor : '#ffffff';
            const textColor = isSelected ? '#ffffff' : baseColor;
            const size = 40;
            const borderSize = 4;
            const iconText = isEmergency ? 'E' : 'T';

            const zIndexOffset = 1000;

            const markerIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `
                    <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;">
                        <div style="width:${size-4}px;height:${size-4}px;border-radius:50%;border:${borderSize}px solid ${baseColor};background:${bgColor};box-shadow:0 4px 14px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:${textColor};font-weight:bold;font-size:${isSelected ? 16 : 14}px;">
                            ${iconText}
                        </div>
                    </div>
                `,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
            });

            const marker = L.marker([site.latitude, site.longitude], { 
                icon: markerIcon,
                zIndexOffset 
            }).addTo(map);

            marker.on('click', () => {
                onSiteSelect(site.id);
            });

            const renderBoundary = (type: 'toal' | 'emergency') => {
                const geomMode = type === 'toal' ? site.toalGeometryMode : site.emergencyGeometryMode;
                const radius   = type === 'toal' ? site.toalRadius       : site.emergencyRadius;
                const pts      = type === 'toal' ? site.toalPolygonPoints : site.emergencyPolygonPoints;
                const colors   = BOUNDARY_COLORS[type];

                // Increase opacity if selected
                const fillOpacity = isSelected ? 0.25 : 0.1;
                const weight = isSelected ? 2 : 1.5;

                if (geomMode === 'circle' && radius) {
                    L.circle([site.latitude, site.longitude], {
                        radius, color: colors.stroke, fillColor: colors.fill,
                        fillOpacity, stroke: true, weight,
                        dashArray: type === 'emergency' ? '4 4' : '',
                        interactive: false,
                    }).addTo(map);
                } else if (geomMode === 'polygon' && pts && pts.length >= 3) {
                    L.polygon(pts, {
                        color: colors.stroke, fillColor: colors.fill,
                        fillOpacity, weight, stroke: true,
                        dashArray: type === 'emergency' ? '4 4' : '',
                        interactive: false,
                    }).addTo(map);
                }
            };

            if (site.siteType === 'toal' || !isEmergency) renderBoundary('toal');
            if (site.allowEmergencyLanding || isEmergency) renderBoundary('emergency');
        });
        
        // If there are selected sites and we just updated selection (not just zoom)
        // Note: Map auto-panning on every zoom can be annoying, so let's only fit bounds if it's explicitly needed
        // Since we removed 'selected' from being just the trigger, we'll keep the markers updated but rely on the user to pan.
        // If we want to pan to selected when selection changes, we could do it here, but it might interfere with zoomend.
        // Let's omit auto-fitBounds on render to avoid zoom loops.
    };

    return (
        <div className={cn('relative w-full h-full flex flex-col', className)}>
            <div
                ref={mapRef}
                className="w-full flex-1 z-0 rounded-l-2xl border-r border-border/60"
                style={{ minHeight: 600 }}
            />
            <div className="absolute top-4 right-4 z-10">
                <SatelliteToggle isSatellite={isSatellite} onToggle={() => setIsSatellite(!isSatellite)} />
            </div>
        </div>
    );
}

function injectLeafletStyles() {
    if (document.getElementById('leaflet-custom-assetmanager')) return;
    const style = document.createElement('style');
    style.id = 'leaflet-custom-assetmanager';
    style.textContent = `
        .custom-div-icon { background: none !important; border: none !important; }
        .custom-leaflet-tooltip {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
            border-radius: 8px;
            padding: 8px;
            color: #0f172a;
        }
    `;
    document.head.appendChild(style);
}
