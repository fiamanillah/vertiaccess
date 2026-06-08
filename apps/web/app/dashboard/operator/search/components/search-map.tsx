'use client'

import * as React from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { Badge } from '@workspace/ui/components/badge'
import type { DetailedSite } from '../../../assetmanager/infrastructure/schema'
import { BOUNDARY_COLORS, MapCenter } from '@/components/map/map-types'
import { SatelliteToggle } from '@/components/map/map-controls'
import { toast } from 'sonner'
import { Loader2, MapPin, MapPinOff, ZoomIn } from 'lucide-react'

type LeafletModule = typeof import('leaflet')

interface ViewportSearchPayload {
  center: MapCenter
  zoom: number
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

interface SearchMapProps {
  sites: DetailedSite[]
  center: MapCenter
  onCenterChange?: (center: MapCenter) => void
  /** Called when debounced move/zoom updates viewport and zoom is acceptable */
  onViewportSearch?: (payload: ViewportSearchPayload) => void
  isLoading?: boolean
  isEmpty?: boolean
  className?: string
}

const MIN_SEARCH_ZOOM = 10
const VIEWPORT_DEBOUNCE_MS = 1000
const MIN_CENTER_DELTA = 0.0003
const MIN_BOUNDS_DELTA = 0.0005

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

function normalizePoint(point: unknown): [number, number] | null {
  if (Array.isArray(point) && point.length >= 2) {
    const lat = Number(point[0])
    const lng = Number(point[1])
    return isValidLatLng(lat, lng) ? [lat, lng] : null
  }

  if (point && typeof point === 'object' && 'lat' in point && 'lng' in point) {
    const p = point as { lat: unknown; lng: unknown }
    const lat = Number(p.lat)
    const lng = Number(p.lng)
    return isValidLatLng(lat, lng) ? [lat, lng] : null
  }

  return null
}

function normalizePolygonPoints(points: unknown): [number, number][] {
  if (!Array.isArray(points)) return []
  return points
    .map((p) => normalizePoint(p))
    .filter((p): p is [number, number] => Array.isArray(p))
}

function polygonCentroid(points: [number, number][]): [number, number] | null {
  if (points.length === 0) return null
  const sum = points.reduce(
    (acc, [lat, lng]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
    { lat: 0, lng: 0 },
  )
  const lat = sum.lat / points.length
  const lng = sum.lng / points.length
  return isValidLatLng(lat, lng) ? [lat, lng] : null
}

function resolveSiteMarkerPosition(
  site: DetailedSite,
): [number, number] | null {
  if (isValidLatLng(site.latitude, site.longitude)) {
    return [site.latitude, site.longitude]
  }

  const toalPts = normalizePolygonPoints(site.toalPolygonPoints)
  const emergencyPts = normalizePolygonPoints(site.emergencyPolygonPoints)
  return polygonCentroid(toalPts) ?? polygonCentroid(emergencyPts)
}

// Debounce utility
function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number,
) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const callback = React.useCallback(
    (...args: TArgs) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay],
  )

  const cancel = React.useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  return { callback, cancel }
}

export function SearchMap({
  sites,
  center,
  onCenterChange,
  onViewportSearch,
  isLoading = false,
  isEmpty = false,
  className,
}: SearchMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null)
  const mapInstanceRef = React.useRef<import('leaflet').Map | null>(null)
  const leafletRef = React.useRef<LeafletModule | null>(null)
  const userMarkerRef = React.useRef<import('leaflet').Marker | null>(null)

  const [isSatellite, setIsSatellite] = React.useState(false)
  const satelliteLayerRef = React.useRef<import('leaflet').TileLayer | null>(
    null,
  )
  const streetLayerRef = React.useRef<import('leaflet').TileLayer | null>(null)
  const labelsLayerRef = React.useRef<import('leaflet').TileLayer | null>(null)

  const [mapBoundsCenter, setMapBoundsCenter] =
    React.useState<MapCenter>(center)
  const [currentZoom, setCurrentZoom] = React.useState(13)
  const [isLocating, setIsLocating] = React.useState(false)
  const [userLocation, setUserLocation] = React.useState<MapCenter | null>(null)
  const hasAutoLocated = React.useRef(false)
  const hasAutoFramedSites = React.useRef(false)
  const lastViewportPayloadRef = React.useRef<ViewportSearchPayload | null>(
    null,
  )
  const isDraggingRef = React.useRef(false)

  // Latest-value refs to avoid stale closures in Leaflet event handlers
  const onViewportSearchRef = React.useRef(onViewportSearch)
  React.useEffect(() => {
    onViewportSearchRef.current = onViewportSearch
  }, [onViewportSearch])

  const onCenterChangeRef = React.useRef(onCenterChange)
  React.useEffect(() => {
    onCenterChangeRef.current = onCenterChange
  }, [onCenterChange])

  const triggerViewportSearch = React.useCallback(
    (payload: ViewportSearchPayload) => {
      onViewportSearchRef.current?.(payload)
    },
    [],
  )

  // Debounced search fired on map move/zoom to reduce request bursts.
  const {
    callback: debouncedViewportSearch,
    cancel: cancelDebouncedViewportSearch,
  } = useDebouncedCallback(triggerViewportSearch, VIEWPORT_DEBOUNCE_MS)

  // Auto-pin user location when the map shows no results (only once per session)
  React.useEffect(() => {
    if (!isEmpty || hasAutoLocated.current || userLocation) return
    hasAutoLocated.current = true
    triggerGeolocation({ silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty])

  // ─── Bootstrap Leaflet ────────────────────────────────────────────────────
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
        center: [center.lat, center.lng],
        zoom: 13,
        zoomControl: true,
      })

      // Ensure tiles render correctly after layout settles.
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

      const emitViewportSearch = () => {
        const c = map.getCenter()
        const b = map.getBounds()
        const zoom = map.getZoom()
        const payload: ViewportSearchPayload = {
          center: { lat: c.lat, lng: c.lng },
          zoom,
          bounds: {
            north: b.getNorth(),
            south: b.getSouth(),
            east: b.getEast(),
            west: b.getWest(),
          },
        }

        setMapBoundsCenter(payload.center)
        setCurrentZoom(zoom)
        onCenterChangeRef.current?.(payload.center)

        const lastPayload = lastViewportPayloadRef.current
        if (lastPayload && lastPayload.zoom === payload.zoom) {
          const centerDelta =
            Math.abs(lastPayload.center.lat - payload.center.lat) +
            Math.abs(lastPayload.center.lng - payload.center.lng)

          const boundsDelta =
            Math.abs(lastPayload.bounds.north - payload.bounds.north) +
            Math.abs(lastPayload.bounds.south - payload.bounds.south) +
            Math.abs(lastPayload.bounds.east - payload.bounds.east) +
            Math.abs(lastPayload.bounds.west - payload.bounds.west)

          if (
            centerDelta < MIN_CENTER_DELTA &&
            boundsDelta < MIN_BOUNDS_DELTA
          ) {
            return
          }
        }

        lastViewportPayloadRef.current = payload

        if (zoom >= MIN_SEARCH_ZOOM) {
          debouncedViewportSearch(payload)
        }
      }

      map.on('moveend', () => {
        if (!isDraggingRef.current) {
          emitViewportSearch()
        }
      })

      map.on('dragstart', () => {
        isDraggingRef.current = true
        cancelDebouncedViewportSearch()
      })

      map.on('dragend', () => {
        isDraggingRef.current = false
        emitViewportSearch()
      })

      map.on('zoomend', () => {
        if (isDraggingRef.current) return
        emitViewportSearch()
      })

      const onWindowResize = () => map.invalidateSize()
      window.addEventListener('resize', onWindowResize)

      mapInstanceRef.current = map
      renderSites(map, L, sites)

      // Initial search for current viewport
      emitViewportSearch()
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

  // External center sync (without recreating the map instance)
  React.useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const mapCenter = map.getCenter()
    const isSameCenter =
      Math.abs(mapCenter.lat - center.lat) < 0.00001 &&
      Math.abs(mapCenter.lng - center.lng) < 0.00001

    if (!isSameCenter) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: false })
    }
  }, [center.lat, center.lng])

  // ─── Re-render site markers when sites change ─────────────────────────────
  React.useEffect(() => {
    const map = mapInstanceRef.current
    const L = leafletRef.current
    if (!map || !L) return
    renderSites(map, L, sites)
  }, [sites])

  // ─── Satellite / street tile toggle ──────────────────────────────────────
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

  // ─── User location marker ─────────────────────────────────────────────────
  React.useEffect(() => {
    const map = mapInstanceRef.current
    const L = leafletRef.current
    if (!map || !L) return

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current)
      userMarkerRef.current = null
    }
    if (!userLocation) return

    const userIcon = L.divIcon({
      className: 'user-location-icon',
      html: `
                <div style="position:relative;width:28px;height:28px;">
                    <div style="
                        position:absolute;inset:0;border-radius:50%;
                        background:rgba(var(--color-primary-rgb,59,130,246),0.22);
                        animation:userPing 1.8s ease-out infinite;
                    "></div>
                    <div style="
                        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                        width:16px;height:16px;border-radius:50%;
                        background:hsl(var(--primary));
                        border:3px solid #fff;
                        box-shadow:0 2px 8px rgba(0,0,0,0.35);
                    "></div>
                </div>
            `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })

    const marker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(map)
    marker.bindTooltip('<strong>You are here</strong>', {
      direction: 'top',
      offset: [0, -14],
      className: 'custom-leaflet-tooltip',
    })
    userMarkerRef.current = marker
  }, [userLocation])

  // ─── Geolocation helper ───────────────────────────────────────────────────
  function triggerGeolocation({ silent = false }: { silent?: boolean } = {}) {
    if (!('geolocation' in navigator)) {
      if (!silent) toast.error('Geolocation is not supported by your browser.')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const loc: MapCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(loc)

        const map = mapInstanceRef.current
        if (map) map.setView([loc.lat, loc.lng], 14, { animate: true })
        if (!silent) toast.success('Showing sites near your location')
      },
      (error) => {
        setIsLocating(false)
        if (!silent) {
          if (error.code === error.PERMISSION_DENIED) {
            toast.error(
              'Location access denied. Enable it in your browser settings.',
            )
          } else {
            toast.error('Unable to retrieve your location. Please try again.')
          }
        }
      },
      { timeout: 10000 },
    )
  }

  const handlePinMyLocation = React.useCallback(() => {
    triggerGeolocation({ silent: false })
  }, [])

  // ─── Render site markers ──────────────────────────────────────────────────
  const renderSites = (
    map: import('leaflet').Map,
    L: LeafletModule,
    sitesToRender: DetailedSite[],
  ) => {
    map.eachLayer((layer: import('leaflet').Layer) => {
      if (
        (layer instanceof L.Marker && layer !== userMarkerRef.current) ||
        layer instanceof L.Circle ||
        layer instanceof L.Polygon
      ) {
        map.removeLayer(layer)
      }
    })

    const boundsPoints: [number, number][] = []

    sitesToRender.forEach((site) => {
      const isAuto = site.bookingApprovalModel === 'auto'
      const isEmergency = site.siteType === 'emergency'
      const markerPosition = resolveSiteMarkerPosition(site)

      if (!markerPosition) {
        return
      }

      boundsPoints.push(markerPosition)

      const color = isEmergency ? '#ef4444' : 'hsl(var(--primary, 221 83% 53%))'
      const iconText = isEmergency ? 'E' : 'T'
      const markerIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
                    <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                        <div style="width:28px;height:28px;border-radius:50%;border:3px solid ${color};background:#ffffff;box-shadow:0 2px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:${color};font-weight:bold;font-size:14px;">
                            ${iconText}
                        </div>
                    </div>
                `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker(markerPosition, {
        icon: markerIcon,
      }).addTo(map)

      const tooltipContent = `
                <div style="padding:4px;font-family:Inter,sans-serif;">
                    <div style="font-weight:bold;font-size:14px;margin-bottom:4px;">${site.name}</div>
                    <div style="color:#666;font-size:12px;margin-bottom:8px;">${site.category ?? ''} • ${isAuto ? 'Auto-Approval' : 'Manual'}</div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:600;font-size:14px;">£${site.siteType === 'toal' ? site.toalFee : site.emergencyFee}</span>
                        <a href="#" style="color:hsl(var(--primary));font-size:12px;font-weight:500;text-decoration:none;">View →</a>
                    </div>
                </div>
            `
      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -16],
        className: 'custom-leaflet-tooltip',
      })

      const renderBoundary = (type: 'toal' | 'emergency') => {
        const geomMode =
          type === 'toal' ? site.toalGeometryMode : site.emergencyGeometryMode
        const radius = type === 'toal' ? site.toalRadius : site.emergencyRadius
        const pts = normalizePolygonPoints(
          type === 'toal'
            ? site.toalPolygonPoints
            : site.emergencyPolygonPoints,
        )
        const colors = BOUNDARY_COLORS[type]

        if (geomMode === 'circle' && radius) {
          L.circle(markerPosition, {
            radius,
            color: colors.stroke,
            fillColor: colors.fill,
            fillOpacity: 0.1,
            stroke: true,
            weight: 1.5,
            dashArray: type === 'emergency' ? '4 4' : '',
          }).addTo(map)

          const dLat = radius / 111320
          const safeCos = Math.max(
            Math.cos((markerPosition[0] * Math.PI) / 180),
            0.01,
          )
          const dLng = radius / (111320 * safeCos)
          boundsPoints.push([
            markerPosition[0] - dLat,
            markerPosition[1] - dLng,
          ])
          boundsPoints.push([
            markerPosition[0] + dLat,
            markerPosition[1] + dLng,
          ])
        } else if (geomMode === 'polygon' && pts && pts.length >= 3) {
          L.polygon(pts, {
            color: colors.stroke,
            fillColor: colors.fill,
            fillOpacity: 0.1,
            weight: 1.5,
            stroke: true,
            dashArray: type === 'emergency' ? '4 4' : '',
          }).addTo(map)
          pts.forEach((p) => boundsPoints.push(p))
        }
      }

      if (site.siteType === 'toal' || !isEmergency) renderBoundary('toal')
      if (site.allowEmergencyLanding || isEmergency) renderBoundary('emergency')
    })

    if (boundsPoints.length > 0 && !hasAutoFramedSites.current) {
      const bounds = L.latLngBounds(boundsPoints)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: false })
      hasAutoFramedSites.current = true
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={cn('relative w-full h-full flex flex-col', className)}>
      {/* Map canvas — always mounted */}
      <div
        ref={mapRef}
        className="w-full flex-1 z-0"
        style={{ minHeight: 400 }}
      />

      {/* ── Loading overlay ── */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-background/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 bg-background/95 border border-border shadow-lg rounded-full px-4 py-2 text-sm font-semibold">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Searching this area…
          </div>
        </div>
      )}

      {/* ── Empty-state overlay (floating, non-blocking) ── */}
      {isEmpty && !isLoading && currentZoom >= MIN_SEARCH_ZOOM && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 bg-background/95 border border-border shadow-xl rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground">
            <MapPinOff className="h-4 w-4 text-muted-foreground/70" />
            No sites found in this area — try panning or zooming out
          </div>
        </div>
      )}

      {currentZoom < MIN_SEARCH_ZOOM && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 bg-background/95 border border-border shadow-xl rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground">
            <ZoomIn className="h-4 w-4 text-muted-foreground/70" />
            Zoom in to level {MIN_SEARCH_ZOOM}+ to load assets
          </div>
        </div>
      )}

      {/* ── Top-right: satellite toggle ── */}
      <div className="absolute top-4 right-4 z-10">
        <SatelliteToggle
          isSatellite={isSatellite}
          onToggle={() => setIsSatellite(!isSatellite)}
        />
      </div>

      {/* ── Bottom-right: Pin My Location button ── */}
      <div className="absolute bottom-8 right-4 z-10">
        <button
          onClick={handlePinMyLocation}
          disabled={isLocating}
          title="Pin my location"
          className={cn(
            'flex items-center justify-center w-11 h-11 rounded-full bg-background border border-border shadow-lg',
            'hover:bg-muted/80 active:scale-95 transition-all duration-150',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            userLocation && 'border-primary/50',
          )}
        >
          {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <MapPin
              className={cn(
                'h-5 w-5',
                userLocation
                  ? 'text-primary fill-primary/20'
                  : 'text-muted-foreground',
              )}
            />
          )}
        </button>
      </div>

      {/* ── Bottom-left: coordinates badge ── */}
      <div className="absolute bottom-6 left-4 z-10 pointer-events-none">
        <Badge
          variant="secondary"
          className="text-[10px] font-mono bg-background/90 backdrop-blur-sm border shadow-sm"
        >
          {mapBoundsCenter.lat.toFixed(5)}, {mapBoundsCenter.lng.toFixed(5)}
        </Badge>
      </div>
    </div>
  )
}

function injectLeafletStyles() {
  if (document.getElementById('leaflet-custom-search')) return
  const style = document.createElement('style')
  style.id = 'leaflet-custom-search'
  style.textContent = `
        .custom-div-icon { background: none !important; border: none !important; }
        .user-location-icon { background: none !important; border: none !important; }
        .custom-leaflet-tooltip {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
            border-radius: 8px;
            padding: 8px;
            color: #0f172a;
        }
        @keyframes userPing {
            0%   { transform: scale(1);   opacity: 0.8; }
            70%  { transform: scale(2.6); opacity: 0; }
            100% { transform: scale(2.6); opacity: 0; }
        }
    `
  document.head.appendChild(style)
}
