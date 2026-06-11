'use client'

import * as React from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { Badge } from '@workspace/ui/components/badge'
import { BOUNDARY_COLORS, MapCenter } from '@/components/map/map-types'
import { SatelliteToggle } from '@/components/map/map-controls'
import {
  Loader2,
  Maximize,
  Target,
  Clock,
  Check,
  Play,
  CheckCircle2,
  X,
  HelpCircle,
} from 'lucide-react'
import type { Booking } from '@/services/booking.types'

function toTitleCase(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

type LeafletModule = typeof import('leaflet')

interface DashboardOperationsMapProps {
  bookings: Booking[]
  selectedBookingId: string | null
  onSelectBooking: (bookingId: string | null) => void
  className?: string
}

const STATUS_CONFIG: Record<
  string,
  {
    color: string
    borderColor: string
    label: string
    svgIcon: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  PENDING: {
    color: '#f59e0b', // Amber-500
    borderColor: '#d97706',
    label: 'Pending',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    icon: Clock,
  },
  APPROVED: {
    color: '#10b981', // Emerald-500
    borderColor: '#059669',
    label: 'Approved',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    icon: Check,
  },
  ACTIVATED: {
    color: '#3b82f6', // Blue-500
    borderColor: '#2563eb',
    label: 'Activated',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
    icon: Play,
  },
  COMPLETED: {
    color: '#6366f1', // Indigo-500
    borderColor: '#4f46e5',
    label: 'Completed',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    icon: CheckCircle2,
  },
  REJECTED: {
    color: '#ef4444', // Red-500
    borderColor: '#dc2626',
    label: 'Rejected',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    icon: X,
  },
  CANCELLED: {
    color: '#ef4444',
    borderColor: '#dc2626',
    label: 'Cancelled',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    icon: X,
  },
  EXPIRED: {
    color: '#ef4444',
    borderColor: '#dc2626',
    label: 'Expired',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    icon: X,
  },
  DEFAULT: {
    color: '#64748b', // Slate-500
    borderColor: '#475569',
    label: 'Unknown',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    icon: HelpCircle,
  },
}

const LEGEND_ITEMS = [
  { label: 'Pending', color: '#f59e0b', icon: Clock },
  { label: 'Approved', color: '#10b981', icon: Check },
  { label: 'Activated', color: '#3b82f6', icon: Play },
  { label: 'Completed', color: '#6366f1', icon: CheckCircle2 },
  { label: 'Rejected / Cancelled', color: '#ef4444', icon: X },
]

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

export function DashboardOperationsMap({
  bookings,
  selectedBookingId,
  onSelectBooking,
  className,
}: DashboardOperationsMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null)
  const mapInstanceRef = React.useRef<import('leaflet').Map | null>(null)
  const leafletRef = React.useRef<LeafletModule | null>(null)

  const [isSatellite, setIsSatellite] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [mapCenter, setMapCenter] = React.useState<MapCenter>({
    lat: 51.505,
    lng: -0.09,
  })

  const satelliteLayerRef = React.useRef<import('leaflet').TileLayer | null>(
    null,
  )
  const streetLayerRef = React.useRef<import('leaflet').TileLayer | null>(null)
  const labelsLayerRef = React.useRef<import('leaflet').TileLayer | null>(null)
  const boundaryLayerRef = React.useRef<import('leaflet').Layer | null>(null)
  const markersRef = React.useRef<{
    [id: string]: import('leaflet').Marker
  }>({})

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
      fitAllBookings(map, L, bookings)
    }
  }, [bookings, fitAllBookings])

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

      const config = (STATUS_CONFIG[booking.status] || STATUS_CONFIG.DEFAULT)!
      const color = config.color

      const isSelected = booking.id === selectedBookingId
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
              z-index: 2;
            ">
              ${config.svgIcon}
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
            toTitleCase(booking.siteName || 'Unknown Site')
          }</div>
          <div style="font-size: 10px; color: #64748b;">
            Ref: <span style="font-family: monospace;">${booking.bookingReference}</span>
          </div>
          <div style="font-size: 11px; margin-top: 4px; font-weight: 600; color: ${color};">
            ${toTitleCase(booking.status)} • ${
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
  }, [bookings, isLoaded, selectedBookingId])

  // ─── Draw Selected Booking Geometry and Focus ──────────────────────────────
  React.useEffect(() => {
    const map = mapInstanceRef.current
    const L = leafletRef.current
    if (!map || !L || !isLoaded) return

    // Clear old selected boundary
    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current)
      boundaryLayerRef.current = null
    }

    if (!selectedBookingId) return

    const booking = bookings.find((b) => b.id === selectedBookingId)
    if (!booking) return

    const pos = resolveBookingPosition(booking)
    if (!pos) return

    // Draw bounds & zoom to marker
    map.setView(pos, 15, { animate: true })

    // Geometry Drawing
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
        boundaryLayerRef.current = circle
      } else if (geomType === 'polygon') {
        const points = toPolygonPoints(geom)
        if (points.length >= 3) {
          const polygon = L.polygon(points, {
            color: colors.stroke,
            fillColor: colors.fill,
            fillOpacity: colors.fillOpacity,
            weight: 2,
          }).addTo(map)
          boundaryLayerRef.current = polygon
        }
      }
    }
  }, [selectedBookingId, bookings, isLoaded])

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
    <div className={cn('relative w-full h-full', className)}>
      {/* Map canvas */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Satellite Toggle */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleFitAll}
          title="Zoom to fit all operations"
          className="flex items-center justify-center bg-background/90 backdrop-blur-sm shadow-sm border border-border hover:bg-background rounded-md px-3 py-1.5 h-8 text-xs font-medium text-foreground transition-all"
        >
          Fit All
        </button>
        <SatelliteToggle
          isSatellite={isSatellite}
          onToggle={() => setIsSatellite(!isSatellite)}
          hideIcon
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

      {/* Map Status Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 p-2.5 bg-background/95 backdrop-blur-md border border-border shadow-lg rounded-xl text-[10px] font-medium text-foreground min-w-[135px] pointer-events-auto select-none">
        <div className="font-semibold border-b border-border/40 pb-1 mb-0.5 text-muted-foreground text-[9px] uppercase tracking-wider">
          Map Legend
        </div>
        <div className="flex flex-col gap-1.5">
          {LEGEND_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  <Icon className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="text-foreground/90 font-medium">{item.label}</span>
              </div>
            )
          })}
        </div>
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
