'use client'

import * as React from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { Badge } from '@workspace/ui/components/badge'
import { SatelliteToggle } from '@/components/map/map-controls'
import type { DetailedSite } from '../schema'

interface InfrastructureDetailMapProps {
  sites: DetailedSite[]
  activeSiteId: string
  onSiteSelect: (siteId: string) => void
  className?: string
}

function getSiteBounds(L: any, site: DetailedSite) {
  const latLngs: any[] = []
  latLngs.push([site.latitude, site.longitude])

  const showToal = site.siteType !== 'emergency'
  const showEmergency = site.siteType === 'emergency' || site.allowEmergencyLanding

  if (showToal) {
    if (
      site.toalGeometryMode === 'polygon' &&
      site.toalPolygonPoints &&
      site.toalPolygonPoints.length >= 3
    ) {
      site.toalPolygonPoints.forEach((pt: any) => {
        if (Array.isArray(pt)) {
          latLngs.push(pt)
        } else if (pt && typeof pt === 'object' && 'lat' in pt && 'lng' in pt) {
          latLngs.push([pt.lat, pt.lng])
        }
      })
    } else if (site.toalRadius) {
      const circle = L.circle([site.latitude, site.longitude], { radius: site.toalRadius })
      const bounds = circle.getBounds()
      latLngs.push(bounds.getNorthEast())
      latLngs.push(bounds.getSouthWest())
    }
  }

  if (showEmergency) {
    if (
      site.emergencyGeometryMode === 'polygon' &&
      site.emergencyPolygonPoints &&
      site.emergencyPolygonPoints.length >= 3
    ) {
      site.emergencyPolygonPoints.forEach((pt: any) => {
        if (Array.isArray(pt)) {
          latLngs.push(pt)
        } else if (pt && typeof pt === 'object' && 'lat' in pt && 'lng' in pt) {
          latLngs.push([pt.lat, pt.lng])
        }
      })
    } else if (site.emergencyRadius) {
      const circle = L.circle([site.latitude, site.longitude], { radius: site.emergencyRadius })
      const bounds = circle.getBounds()
      latLngs.push(bounds.getNorthEast())
      latLngs.push(bounds.getSouthWest())
    }
  }

  return L.latLngBounds(latLngs)
}

/**
 * Full-height map showing all landowner infrastructure sites.
 * The active site is highlighted; clicking any other boundary selects it.
 * Uses Leaflet directly to support multiple independent boundaries.
 */
export function InfrastructureDetailMap({
  sites,
  activeSiteId,
  onSiteSelect,
  className,
}: InfrastructureDetailMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null)
  const mapInstanceRef = React.useRef<any>(null)
  const layersRef = React.useRef<any[]>([])
  const [isSatellite, setIsSatellite] = React.useState(false)
  const tileLayerRef = React.useRef<any>(null)
  const [isReady, setIsReady] = React.useState(false)

  // Initialize the Leaflet map
  React.useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false

    async function init() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (cancelled || !mapRef.current) return

      const activeSite = sites.find((s) => s.id === activeSiteId) ?? sites[0]
      const center = activeSite
        ? { lat: activeSite.latitude, lng: activeSite.longitude }
        : { lat: 51.505, lng: -0.09 }

      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      })

      const osmTile = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19, className: 'osm-tiles' },
      )
      osmTile.addTo(map)
      tileLayerRef.current = osmTile

      mapInstanceRef.current = map
      setIsReady(true)
    }

    init()

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Toggle satellite / OSM
  React.useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !isReady) return

    ;(async () => {
      const L = (await import('leaflet')).default

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current)
      }

      if (isSatellite) {
        tileLayerRef.current = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 },
        )
      } else {
        tileLayerRef.current = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { maxZoom: 19, className: 'osm-tiles' },
        )
      }

      tileLayerRef.current.addTo(map)
    })()
  }, [isSatellite, isReady])

  // Draw all site boundaries
  React.useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !isReady || sites.length === 0) return

    ;(async () => {
      const L = (await import('leaflet')).default

      // Clear existing layers
      layersRef.current.forEach((layer) => {
        map.removeLayer(layer)
      })
      layersRef.current = []

      sites.forEach((site) => {
        const isActive = site.id === activeSiteId
        const color = isActive ? '#5b6cf9' : '#94a3b8'
        const fillOpacity = isActive ? 0.2 : 0.08
        const weight = isActive ? 3 : 1.5

        const center = L.latLng(site.latitude, site.longitude)

        const showToal = site.siteType !== 'emergency'
        const showEmergency = site.siteType === 'emergency' || site.allowEmergencyLanding

        // Draw TOAL boundary
        if (showToal) {
          if (
            site.toalGeometryMode === 'polygon' &&
            site.toalPolygonPoints &&
            site.toalPolygonPoints.length >= 3
          ) {
            const polygon = L.polygon(site.toalPolygonPoints, {
              color,
              fillColor: color,
              fillOpacity,
              weight,
            })
            polygon.on('click', () => onSiteSelect(site.id))
            polygon.addTo(map)
            layersRef.current.push(polygon)
          } else if (site.toalRadius) {
            const circle = L.circle(center, {
              radius: site.toalRadius,
              color,
              fillColor: color,
              fillOpacity,
              weight,
            })
            circle.on('click', () => onSiteSelect(site.id))
            circle.addTo(map)
            layersRef.current.push(circle)
          }
        }

        // Draw emergency boundary if enabled
        if (showEmergency) {
          const emergencyColor = isActive ? '#f59e0b' : '#cbd5e1'
          if (
            site.emergencyGeometryMode === 'polygon' &&
            site.emergencyPolygonPoints &&
            site.emergencyPolygonPoints.length >= 3
          ) {
            const polygon = L.polygon(site.emergencyPolygonPoints, {
              color: emergencyColor,
              fillColor: emergencyColor,
              fillOpacity: isActive ? 0.1 : 0.04,
              weight: isActive ? 2 : 1,
              dashArray: '6 4',
            })
            polygon.on('click', () => onSiteSelect(site.id))
            polygon.addTo(map)
            layersRef.current.push(polygon)
          } else if (site.emergencyRadius) {
            const circle = L.circle(center, {
              radius: site.emergencyRadius,
              color: emergencyColor,
              fillColor: emergencyColor,
              fillOpacity: isActive ? 0.1 : 0.04,
              weight: isActive ? 2 : 1,
              dashArray: '6 4',
            })
            circle.on('click', () => onSiteSelect(site.id))
            circle.addTo(map)
            layersRef.current.push(circle)
          }
        }

        // Marker label for inactive sites
        const labelIcon = L.divIcon({
          className: 'custom-label-icon',
          html: `<div style="
            background: ${isActive ? '#5b6cf9' : '#64748b'};
            color: white;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            border: 2px solid ${isActive ? '#4f5bd5' : '#475569'};
            ${isActive ? 'transform: scale(1.1);' : ''}
          ">${site.name}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, -10],
        })

        const marker = L.marker(center, { icon: labelIcon })
        marker.on('click', () => onSiteSelect(site.id))
        marker.addTo(map)
        layersRef.current.push(marker)
      })

      // Fit bounds to active site
      const activeSite = sites.find((s) => s.id === activeSiteId)
      if (activeSite) {
        const bounds = getSiteBounds(L, activeSite)
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true })
      }
    })()
  }, [sites, activeSiteId, onSiteSelect, isReady])

  const activeSite = sites.find((s) => s.id === activeSiteId)

  return (
    <div className={cn('relative h-full', className)}>
      <div
        ref={mapRef}
        className="w-full h-full z-0"
        style={{ minHeight: 400 }}
      />

      {/* Top-right: satellite toggle */}
      <div className="absolute top-3 right-3 z-10">
        <SatelliteToggle
          isSatellite={isSatellite}
          onToggle={() => setIsSatellite(!isSatellite)}
        />
      </div>

      {/* Bottom-left: coordinates */}
      {activeSite && (
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <Badge
            variant="secondary"
            className="text-[10px] font-mono bg-background/90 backdrop-blur-sm border shadow-sm pointer-events-auto"
          >
            {activeSite.latitude.toFixed(6)},{' '}
            {activeSite.longitude.toFixed(6)}
          </Badge>
        </div>
      )}

      {/* Bottom-right: site count */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
        <Badge
          variant="secondary"
          className="text-[10px] font-bold bg-background/90 backdrop-blur-sm border shadow-sm pointer-events-auto"
        >
          {sites.length} asset{sites.length !== 1 ? 's' : ''} on map
        </Badge>
      </div>
    </div>
  )
}
