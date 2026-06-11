'use client'

import * as React from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { Badge } from '@workspace/ui/components/badge'
import { BOUNDARY_COLORS, MapCenter } from '@/components/map/map-types'
import { SatelliteToggle } from '@/components/map/map-controls'
import { Loader2, Maximize } from 'lucide-react'
import type { Booking } from '@/services/booking.types'

type LeafletModule = typeof import('leaflet')

interface MissionPlanningMapProps {
  bookings: Booking[]
  selectedBookingIds: Set<string>
  focusedBookingId: string | null
  onSelectBooking: (bookingId: string) => void
  className?: string
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

function toGeometryCenter(geometry: any): MapCenter | null {
  const geom = geometry as
    | {
        type?: string
        center?: { lat?: number; lng?: number } | null
        points?: any[] | null
      }
    | null
    | undefined

  if (
    geom?.type === 'polygon' &&
    Array.isArray(geom.points) &&
    geom.points.length > 0
  ) {
    let sumLat = 0,
      sumLng = 0,
      count = 0
    for (const point of geom.points) {
      if (
        point &&
        typeof point === 'object' &&
        !Array.isArray(point) &&
        typeof point.lat === 'number' &&
        typeof point.lng === 'number'
      ) {
        sumLat += point.lat
        sumLng += point.lng
        count++
      } else if (
        Array.isArray(point) &&
        point.length >= 2 &&
        typeof point[0] === 'number' &&
        typeof point[1] === 'number'
      ) {
        sumLat += point[0]
        sumLng += point[1]
        count++
      }
    }
    if (count > 0) {
      return { lat: sumLat / count, lng: sumLng / count }
    }
  }

  const center = geom?.center
  if (
    center &&
    typeof center.lat === 'number' &&
    typeof center.lng === 'number'
  ) {
    return { lat: center.lat, lng: center.lng }
  }

  return null
}

function toPolygonPoints(geometry: any): [number, number][] {
  if (!geometry || !Array.isArray(geometry.points)) return []
  return geometry.points
    .map((point: any): [number, number] | null => {
      if (
        point &&
        typeof point === 'object' &&
        !Array.isArray(point) &&
        typeof point.lat === 'number' &&
        typeof point.lng === 'number'
      ) {
        return [point.lat, point.lng]
      }
      if (
        Array.isArray(point) &&
        point.length >= 2 &&
        typeof point[0] === 'number' &&
        typeof point[1] === 'number'
      ) {
        return [point[0], point[1]]
      }
      return null
    })
    .filter((p: [number, number] | null): p is [number, number] => p !== null)
}

function toGeometryMode(geometry: any): 'circle' | 'polygon' {
  const geom = geometry as { type?: string } | null | undefined
  return geom?.type === 'polygon' ? 'polygon' : 'circle'
}

function resolveBookingPosition(booking: Booking): [number, number] | null {
  const isEmergency = booking.useCategory === 'emergency_recovery'
  const geom =
    isEmergency && booking.siteClzGeometry
      ? booking.siteClzGeometry
      : booking.siteGeometry
  const center = toGeometryCenter(geom)
  if (center && isValidLatLng(center.lat, center.lng)) {
    return [center.lat, center.lng]
  }
  return null
}

export function MissionPlanningMap({
  bookings,
  selectedBookingIds,
  focusedBookingId,
  onSelectBooking,
  className,
}: MissionPlanningMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null)
  const mapInstanceRef = React.useRef<import('leaflet').Map | null>(null)
  const leafletRef = React.useRef<LeafletModule | null>(null)

  const [isSatellite, setIsSatellite] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [mapCenter, setMapCenter] = React.useState<MapCenter>({
    lat: 51.505,
    lng: -0.09,
  })

  const satelliteLayerRef = React.useRef<import('leaflet').TileLayer | null>(null)
  const streetLayerRef = React.useRef<import('leaflet').TileLayer | null>(null)
  const labelsLayerRef = React.useRef<import('leaflet').TileLayer | null>(null)
  const boundaryLayersRef = React.useRef<import('leaflet').Layer[]>([])
  const markersRef = React.useRef<{ [id: string]: import('leaflet').Marker }>({})

  // Keep references to event handlers to avoid stale closures
  const onSelectBookingRef = React.useRef(onSelectBooking)
  React.useEffect(() => {
    onSelectBookingRef.current = onSelectBooking
  }, [onSelectBooking])

  // Bootstrap Leaflet
  React.useEffect(() => {
    if (!mapRef.current) return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((L) => {
      leafletRef.current = L
      if (mapInstanceRef.current) return

      injectLeafletStyles()

      const map = L.map(mapRef.current!, {
        center: [51.505, -0.09],
        zoom: 12,
        zoomControl: true,
      })

      // Ensure tiles render correctly
      setTimeout(() => {
        map.invalidateSize()
      }, 0)

      satelliteLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri', maxZoom: 19 },
      )
      streetLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          className: 'osm-tiles',
        },
      )
      labelsLayerRef.current = L.tileLayer(
        'https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png',
        { opacity: 0.5, maxZoom: 19 },
      )

      streetLayerRef.current.addTo(map)

      map.on('moveend', () => {
        const c = map.getCenter()
        setMapCenter({ lat: c.lat, lng: c.lng })
      })

      const onWindowResize = () => map.invalidateSize()
      window.addEventListener('resize', onWindowResize)

      mapInstanceRef.current = map
      setIsLoaded(true)

      // Fit map bounds to bookings initially if any exist
      fitAllBookings(map, L, bookings)

      ;(map as unknown as { __onWindowResize?: () => void }).__onWindowResize =
        onWindowResize
    })

    return () => {
      if (mapInstanceRef.current) {
        const resizeHandler = (
          mapInstanceRef.current as unknown as { __onWindowResize?: () => void }
        ).__onWindowResize
        if (resizeHandler) {
          window.removeEventListener('resize', resizeHandler)
        }
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Fit All Bookings Helper ──────────────────────────────────────────────
  const fitAllBookings = React.useCallback(
    (
      map: import('leaflet').Map,
      L: LeafletModule,
      bookingsToFit: Booking[],
    ) => {
      if (bookingsToFit.length === 0) return

      const boundsPoints: [number, number][] = []
      bookingsToFit.forEach((b) => {
        const pos = resolveBookingPosition(b)
        if (pos) {
          boundsPoints.push(pos)
        }
      })

      if (boundsPoints.length > 0) {
        const bounds = L.latLngBounds(boundsPoints)
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true })
      }
    },
    [],
  )

  const handleFitAll = React.useCallback(() => {
    const map = mapInstanceRef.current
    const L = leafletRef.current
    if (map && L) {
      // Fit to selected bookings if any, otherwise fit to all bookings
      const selected = bookings.filter(b => selectedBookingIds.has(b.id))
      fitAllBookings(map, L, selected.length > 0 ? selected : bookings)
    }
  }, [bookings, selectedBookingIds, fitAllBookings])

  // ─── Render Booking Markers ────────────────────────────────────────────────
  React.useEffect(() => {
    const map = mapInstanceRef.current
    const L = leafletRef.current
    if (!map || !L || !isLoaded) return

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => {
      map.removeLayer(marker)
    })
    markersRef.current = {}

    bookings.forEach((booking) => {
      const pos = resolveBookingPosition(booking)
      if (!pos) return

      // Color mapping by booking status
      let color = '#3b82f6' // Default Blue
      if (booking.status === 'PENDING') {
        color = '#f59e0b' // Amber
      } else if (booking.status === 'COMPLETED') {
        color = '#10b981' // Green
      } else if (
        booking.status === 'CANCELLED' ||
        booking.status === 'REJECTED' ||
        booking.status === 'EXPIRED'
      ) {
        color = '#ef4444' // Red
      }

      const isSelected = selectedBookingIds.has(booking.id) || booking.id === focusedBookingId
      const pinClass = isSelected ? 'booking-pin-selected' : 'booking-pin'
      const shadowPulse = isSelected
        ? `<div class="marker-pulse-ring" style="background:${color};"></div>`
        : ''

      const markerIcon = L.divIcon({
        className: 'custom-booking-marker',
        html: `
          <div class="${pinClass}" style="position:relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            ${shadowPulse}
            <div style="
              width: 24px; 
              height: 24px; 
              border-radius: 50%; 
              border: 2px solid ${isSelected ? '#ffffff' : color}; 
              background: ${color}; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3); 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: #ffffff; 
              font-weight: bold; 
              font-size: 11px;
              z-index: 2;
            ">
              ${booking.siteName?.charAt(0).toUpperCase() || 'O'}
            </div>
            <div class="pin-triangle" style="
              width: 0; 
              height: 0; 
              border-left: 5px solid transparent; 
              border-right: 5px solid transparent; 
              border-top: 6px solid ${color};
              margin-top: -1px;
              z-index: 1;
            "></div>
          </div>
        `,
        iconSize: [32, 38],
        iconAnchor: [16, 30],
      })

      const marker = L.marker(pos, {
        icon: markerIcon,
        zIndexOffset: isSelected ? 1000 : 0,
      }).addTo(map)

      marker.on('click', () => {
        onSelectBookingRef.current(booking.id)
      })

      const tooltipContent = `
        <div style="padding: 4px; font-family: Inter, sans-serif; min-width: 140px;">
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 2px;">${
            booking.siteName || 'Unknown Site'
          }</div>
          <div style="font-size: 10px; color: #64748b;">
            Ref: <span style="font-family: monospace;">${booking.bookingReference}</span>
          </div>
          <div style="font-size: 11px; margin-top: 4px; font-weight: 600; color: ${color};">
            ${booking.status} • ${
              booking.useCategory === 'planned_toal'
                ? 'Planned TOAL'
                : 'Emergency Recovery'
            }
          </div>
        </div>
      `
      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -26],
        className: 'custom-leaflet-tooltip',
      })

      markersRef.current[booking.id] = marker
    })
  }, [bookings, isLoaded, selectedBookingIds, focusedBookingId])

  // ─── Draw Checked Bookings Geometries and Fit Bounds ──────────────────────
  React.useEffect(() => {
    const map = mapInstanceRef.current
    const L = leafletRef.current
    if (!map || !L || !isLoaded) return

    // Clear old boundaries
    boundaryLayersRef.current.forEach((layer) => {
      map.removeLayer(layer)
    })
    boundaryLayersRef.current = []

    const layers: import('leaflet').Layer[] = []
    const boundsPoints: [number, number][] = []

    bookings.forEach((booking) => {
      if (!selectedBookingIds.has(booking.id)) return

      const pos = resolveBookingPosition(booking)
      if (!pos) return

      boundsPoints.push(pos)

      const isEmergency = booking.useCategory === 'emergency_recovery'
      const geom =
        isEmergency && booking.siteClzGeometry
          ? booking.siteClzGeometry
          : booking.siteGeometry

      if (geom) {
        const geomType = toGeometryMode(geom)
        const colors = isEmergency ? BOUNDARY_COLORS.emergency : BOUNDARY_COLORS.toal

        if (geomType === 'circle') {
          const radius = (geom as any)?.radius ?? 150
          const circle = L.circle(pos, {
            radius,
            color: colors.stroke,
            fillColor: colors.fill,
            fillOpacity: colors.fillOpacity,
            weight: 2,
          }).addTo(map)
          layers.push(circle)
        } else if (geomType === 'polygon') {
          const points = toPolygonPoints(geom)
          if (points.length >= 3) {
            const polygon = L.polygon(points, {
              color: colors.stroke,
              fillColor: colors.fill,
              fillOpacity: colors.fillOpacity,
              weight: 2,
            }).addTo(map)
            layers.push(polygon)
          }
        }
      }
    })

    boundaryLayersRef.current = layers

    // Fit map bounds to show all checked boundaries (if any exist)
    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true })
    }
  }, [selectedBookingIds, bookings, isLoaded])

  // ─── Center/Zoom on Focused Booking ID ─────────────────────────────────────
  React.useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !focusedBookingId || !isLoaded) return

    const booking = bookings.find((b) => b.id === focusedBookingId)
    if (!booking) return

    const pos = resolveBookingPosition(booking)
    if (pos) {
      map.setView(pos, 15, { animate: true })
    }
  }, [focusedBookingId, bookings, isLoaded])

  // ─── Satellite / Street view toggle ────────────────────────────────────────
  React.useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    if (isSatellite) {
      if (streetLayerRef.current) map.removeLayer(streetLayerRef.current)
      satelliteLayerRef.current?.addTo(map)
      labelsLayerRef.current?.addTo(map)
    } else {
      if (satelliteLayerRef.current) map.removeLayer(satelliteLayerRef.current)
      if (labelsLayerRef.current) map.removeLayer(labelsLayerRef.current)
      streetLayerRef.current?.addTo(map)
    }
  }, [isSatellite])

  return (
    <div className={cn('relative w-full h-full flex flex-col', className)}>
      {/* Map canvas */}
      <div ref={mapRef} className="w-full h-full min-h-[400px] z-0 rounded-lg" />

      {/* Satellite Toggle */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleFitAll}
          title="Zoom to fit checked operations"
          className="flex items-center justify-center bg-background/90 backdrop-blur-sm shadow-sm border border-border hover:bg-background rounded-md px-3 py-1.5 h-8 text-xs font-medium text-foreground transition-all"
        >
          <Maximize className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          Fit Checked
        </button>
        <SatelliteToggle
          isSatellite={isSatellite}
          onToggle={() => setIsSatellite(!isSatellite)}
        />
      </div>

      {/* Bottom-left: coordinates badge */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <Badge
          variant="secondary"
          className="text-[9px] font-mono bg-background/90 backdrop-blur-sm border shadow-sm"
        >
          {mapCenter.lat.toFixed(5)}, {mapCenter.lng.toFixed(5)}
        </Badge>
      </div>
    </div>
  )
}

function injectLeafletStyles() {
  if (document.getElementById('leaflet-custom-operator-dashboard')) return
  const style = document.createElement('style')
  style.id = 'leaflet-custom-operator-dashboard'
  style.textContent = `
    .custom-booking-marker { background: none !important; border: none !important; }
    .custom-leaflet-tooltip {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-radius: 8px;
      padding: 8px;
      color: #0f172a;
    }
    .booking-pin {
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.2s ease;
    }
    .booking-pin-selected {
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: scale(1.15) translateY(-4px);
      transition: all 0.2s ease;
    }
    .pin-triangle {
      display: block;
      margin-top: -2px;
    }
    .marker-pulse-ring {
      position: absolute;
      top: -2px;
      left: 2px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      animation: pinPing 1.8s ease-out infinite;
      z-index: 0;
    }
    @keyframes pinPing {
      0%   { transform: scale(1);   opacity: 0.7; }
      70%  { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(2.2); opacity: 0; }
    }
  `
  document.head.appendChild(style)
}
