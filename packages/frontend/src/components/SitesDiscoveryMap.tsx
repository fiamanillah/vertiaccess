import { useEffect, useRef, useState } from 'react';
import type { Site } from '../types';
import L from 'leaflet';
import { loadLeafletCSS } from '../utils/leafletLoader';
import { Map, Satellite, Search } from 'lucide-react';

interface SitesDiscoveryMapProps {
  sites: Site[];
  onSiteClick: (site: Site) => void;
}

export function SitesDiscoveryMap({ sites, onSiteClick }: SitesDiscoveryMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const geometriesRef = useRef<L.Layer[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [viewMode, setViewMode] = useState<'street' | 'satellite'>('street');
  const [searchQuery, setSearchQuery] = useState('');
  const [markerCount, setMarkerCount] = useState(0);

  // Load Leaflet CSS once globally
  useEffect(() => {
    loadLeafletCSS().then(() => setMapReady(true));
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !mapReady || mapRef.current) return;

    // Create map centered on London
    const map = L.map(mapContainerRef.current, {
      center: [51.5074, -0.1278],
      zoom: 11,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
    });

    // Add street view layer
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    });
    
    // Add satellite layer
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri',
      maxZoom: 19,
    });

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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapReady]);

  // Render site markers and geometries
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear existing markers and geometries
    markersRef.current.forEach(marker => marker.remove());
    geometriesRef.current.forEach(geometry => geometry.remove());
    markersRef.current = [];
    geometriesRef.current = [];

    // Filter sites by search query
    const filteredSites = searchQuery
      ? sites.filter(site => 
          site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          site.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : sites;

    if (filteredSites.length === 0) {
      console.log('No sites to display');
      return;
    }

    console.log('Rendering', filteredSites.length, 'sites on map');

    filteredSites.forEach(site => {
      // Get site center
      let center: { lat: number; lng: number } | null = null;
      
      // Try to get center from primary geometry
      if (site.geometry && site.geometry.type === 'circle' && site.geometry.center) {
        center = site.geometry.center;
      } else if (site.geometry && site.geometry.type === 'polygon' && site.geometry.points && site.geometry.points.length > 0) {
        // Calculate center of polygon
        const lats = site.geometry.points.map(p => p.lat);
        const lngs = site.geometry.points.map(p => p.lng);
        center = {
          lat: lats.reduce((a, b) => a + b, 0) / lats.length,
          lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
        };
      } 
      // Fallback to CLZ geometry if primary is missing
      else if (site.clzGeometry && site.clzGeometry.type === 'circle' && site.clzGeometry.center) {
        center = site.clzGeometry.center;
      } else if (site.clzGeometry && site.clzGeometry.type === 'polygon' && site.clzGeometry.points && site.clzGeometry.points.length > 0) {
        const lats = site.clzGeometry.points.map(p => p.lat);
        const lngs = site.clzGeometry.points.map(p => p.lng);
        center = {
          lat: lats.reduce((a, b) => a + b, 0) / lats.length,
          lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
        };
      }

      if (!center) {
        return; // Skip if no valid center
      }

      // Draw TOAL geometry (blue)
      if (site.geometry && site.geometry.type === 'circle' && site.geometry.center && site.geometry.radius) {
        const circle = L.circle([site.geometry.center.lat, site.geometry.center.lng], {
          radius: site.geometry.radius,
          color: '#0047FF',
          fillColor: '#60A5FA',
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(mapRef.current!);
        geometriesRef.current.push(circle);

        circle.on('click', () => onSiteClick(site));
      } else if (site.geometry && site.geometry.type === 'polygon' && site.geometry.points && site.geometry.points.length >= 3) {
        const polygon = L.polygon(
          site.geometry.points.map((p) => [p.lat, p.lng]),
          {
            color: '#4f46e5',
            fillColor: '#818cf8',
            fillOpacity: 0.2,
            weight: 2,
          }
        ).addTo(mapRef.current!);
        geometriesRef.current.push(polygon);

        polygon.on('click', () => onSiteClick(site));
      }

      // Draw CLZ geometry (amber) if enabled
      if (site.clzEnabled && site.clzGeometry) {
        if (site.clzGeometry.type === 'circle' && site.clzGeometry.center && site.clzGeometry.radius) {
          const clzCircle = L.circle([site.clzGeometry.center.lat, site.clzGeometry.center.lng], {
            radius: site.clzGeometry.radius,
            color: '#f59e0b',
            fillColor: '#fbbf24',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '10, 5',
          }).addTo(mapRef.current);
          geometriesRef.current.push(clzCircle);

          clzCircle.on('click', () => onSiteClick(site));
        } else if (site.clzGeometry.type === 'polygon' && site.clzGeometry.points && site.clzGeometry.points.length >= 3) {
          const clzPolygon = L.polygon(
            site.clzGeometry.points.map((p) => [p.lat, p.lng]),
            {
              color: '#f59e0b',
              fillColor: '#fbbf24',
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '10, 5',
            }
          ).addTo(mapRef.current);
          geometriesRef.current.push(clzPolygon);

          clzPolygon.on('click', () => onSiteClick(site));
        }
      }

      // Create custom pin icon based on site type
      const hasCLZ = site.clzEnabled && site.clzGeometry;
      
      // TOAL Pin (Blue)
      const toalPinIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `
          <div style="position: relative; width: 32px; height: 40px;">
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C9.373 0 4 5.373 4 12c0 8 12 28 12 28s12-20 12-28c0-6.627-5.373-12-12-12z" fill="#0047FF"/>
              <path d="M16 0C9.373 0 4 5.373 4 12c0 8 12 28 12 28s12-20 12-28c0-6.627-5.373-12-12-12z" fill="url(#paint0_linear)" fill-opacity="0.2"/>
              <circle cx="16" cy="12" r="5" fill="white"/>
              <defs>
                <linearGradient id="paint0_linear" x1="16" y1="0" x2="16" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stop-color="white" stop-opacity="0.3"/>
                  <stop offset="1" stop-color="white" stop-opacity="0"/>
                </linearGradient>
              </defs>
            </svg>
            ${site.autoApprove ? '<div style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background: #10b981; border: 2px solid white; border-radius: 50%;"></div>' : ''}
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      });

      // Add TOAL marker at center
      const toalMarker = L.marker([center.lat, center.lng], {
        icon: toalPinIcon,
      }).addTo(mapRef.current);

      // Add popup with site info
      toalMarker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0047FF;">📍 ${site.name}</h3>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280;">${site.address}</p>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
            ${site.autoApprove ? '<span style="padding: 2px 6px; background-color: #d1fae5; color: #065f46; border-radius: 4px; font-size: 10px;">Auto-approve</span>' : ''}
            ${site.clzEnabled ? '<span style="padding: 2px 6px; background-color: #fef3c7; color: #92400e; border-radius: 4px; font-size: 10px;">Emergency Available</span>' : ''}
          </div>
          <p style="margin: 0; font-size: 11px; color: #0047FF; cursor: pointer; font-weight: 600;" onclick="this.dispatchEvent(new CustomEvent('viewDetails', { bubbles: true }))">View Details →</p>
        </div>
      `);

      // Handle marker click
      toalMarker.on('click', () => {
        onSiteClick(site);
      });

      // Handle "View Details" click in popup
      toalMarker.on('popupopen', () => {
        const popup = toalMarker.getPopup();
        if (popup) {
          const popupElement = popup.getElement();
          if (popupElement) {
            popupElement.addEventListener('viewDetails', () => {
              onSiteClick(site);
            });
          }
        }
      });

      markersRef.current.push(toalMarker);

      // Add Emergency marker if Emergency is enabled (offset from TOAL marker)
      if (hasCLZ) {
        let clzCenter: { lat: number; lng: number };
        if (site.clzGeometry!.type === 'circle' && site.clzGeometry!.center) {
          clzCenter = site.clzGeometry!.center;
        } else if (site.clzGeometry!.type === 'polygon' && site.clzGeometry!.points && site.clzGeometry!.points.length > 0) {
          const lats = site.clzGeometry!.points.map(p => p.lat);
          const lngs = site.clzGeometry!.points.map(p => p.lng);
          clzCenter = {
            lat: lats.reduce((a, b) => a + b, 0) / lats.length,
            lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
          };
        } else {
          return;
        }

        // Emergency Pin (Amber) - slightly offset to show both pins
        const clzPinIcon = L.divIcon({
          className: 'custom-pin-icon',
          html: `
            <div style="position: relative; width: 32px; height: 40px;">
              <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C9.373 0 4 5.373 4 12c0 8 12 28 12 28s12-20 12-28c0-6.627-5.373-12-12-12z" fill="#F59E0B"/>
                <path d="M16 0C9.373 0 4 5.373 4 12c0 8 12 28 12 28s12-20 12-28c0-6.627-5.373-12-12-12z" fill="url(#paint0_linear_clz)" fill-opacity="0.2"/>
                <circle cx="16" cy="12" r="5" fill="white"/>
                <path d="M16 9L16.5 11H18.5L17 12L17.5 14L16 13L14.5 14L15 12L13.5 11H15.5L16 9Z" fill="#F59E0B"/>
                <defs>
                  <linearGradient id="paint0_linear_clz" x1="16" y1="0" x2="16" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stop-color="white" stop-opacity="0.3"/>
                    <stop offset="1" stop-color="white" stop-opacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          `,
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
        });

        // Offset the Emergency marker slightly (0.0002 degrees ~ 20 meters)
        const clzMarker = L.marker([clzCenter.lat + 0.0002, clzCenter.lng + 0.0002], {
          icon: clzPinIcon,
        }).addTo(mapRef.current);

        clzMarker.bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #f59e0b;">⚠️ ${site.name} (Emergency and Recovery)</h3>
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280;">${site.address}</p>
            <p style="margin: 0 0 8px 0; font-size: 11px; color: #92400e; background: #fef3c7; padding: 4px 6px; border-radius: 4px;">Emergency Recovery Zone</p>
            <p style="margin: 0; font-size: 11px; color: #f59e0b; cursor: pointer; font-weight: 600;" onclick="this.dispatchEvent(new CustomEvent('viewDetails', { bubbles: true }))">View Details →</p>
          </div>
        `);

        clzMarker.on('click', () => {
          onSiteClick(site);
        });

        clzMarker.on('popupopen', () => {
          const popup = clzMarker.getPopup();
          if (popup) {
            const popupElement = popup.getElement();
            if (popupElement) {
              popupElement.addEventListener('viewDetails', () => {
                onSiteClick(site);
              });
            }
          }
        });

        markersRef.current.push(clzMarker);
      }
    });

    setMarkerCount(markersRef.current.length);
  }, [sites, onSiteClick, searchQuery, mapReady]);

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

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery && mapRef.current && sites.length > 0) {
      // Find first matching site and center map on it
      const matchingSite = sites.find(site => 
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.address.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (matchingSite) {
        let center: { lat: number; lng: number } | null = null;
        
        if (matchingSite.geometry && matchingSite.geometry.type === 'circle' && matchingSite.geometry.center) {
          center = matchingSite.geometry.center;
        } else if (matchingSite.geometry && matchingSite.geometry.type === 'polygon' && matchingSite.geometry.points && matchingSite.geometry.points.length > 0) {
          const lats = matchingSite.geometry.points.map(p => p.lat);
          const lngs = matchingSite.geometry.points.map(p => p.lng);
          center = {
            lat: lats.reduce((a, b) => a + b, 0) / lats.length,
            lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
          };
        } else if (matchingSite.clzGeometry && matchingSite.clzGeometry.type === 'circle' && matchingSite.clzGeometry.center) {
          center = matchingSite.clzGeometry.center;
        } else if (matchingSite.clzGeometry && matchingSite.clzGeometry.type === 'polygon' && matchingSite.clzGeometry.points && matchingSite.clzGeometry.points.length > 0) {
          const lats = matchingSite.clzGeometry.points.map(p => p.lat);
          const lngs = matchingSite.clzGeometry.points.map(p => p.lng);
          center = {
            lat: lats.reduce((a, b) => a + b, 0) / lats.length,
            lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
          };
        }

        if (center) {
          mapRef.current.setView([center.lat, center.lng], 15, { animate: true });
        }
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full bg-gray-100" />
      
      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-md px-4"
      >
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by site name or location..."
            className="w-full px-4 py-3 pr-12 rounded-lg shadow-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Search className="size-4" />
          </button>
        </div>
      </form>

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
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-md p-3 border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 bg-indigo-500 bg-opacity-30 border-2 border-indigo-700 rounded"></div>
            <span className="text-gray-700">TOAL Sites</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 bg-amber-400 bg-opacity-20 border-2 border-amber-600 rounded"></div>
            <span className="text-gray-700">Emergency Regions</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {sites.length} site{sites.length !== 1 ? 's' : ''} available
        </p>
        <p className="text-xs text-indigo-600 mt-1">
          {markerCount} marker{markerCount !== 1 ? 's' : ''} on map
        </p>
      </div>
      
      {/* Compass */}
      <div className="absolute top-4 right-4 bg-white rounded-full shadow-md p-2 w-12 h-12 flex items-center justify-center z-[1000]">
        <div className="text-xs font-medium text-gray-700">N</div>
        <div className="absolute top-1 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500"></div>
      </div>
    </div>
  );
}