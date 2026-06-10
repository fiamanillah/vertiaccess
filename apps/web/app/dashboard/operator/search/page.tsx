'use client'

import * as React from 'react'
import Link from 'next/link'
import { SearchHeader } from './components/search-header'
import { MapView } from './components/map-view'
import type { DetailedSite } from '../../assetmanager/infrastructure/schema'
import { siteService } from '@/services/site.service'
import { DEFAULT_CENTER, MapCenter } from '@/components/map/map-types'
import { Search, MapPin, Zap, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Button } from '@workspace/ui/components/button'
import { AssetManagerSiteDetails } from '../../assetmanager/infrastructure/components/asset-manager-site-details'

const MIN_SEARCH_ZOOM = 10

interface ViewportState {
  center: MapCenter
  zoom: number
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

type ApiSite = Record<string, unknown>

function radiusByZoom(zoom: number): string {
  if (zoom >= 13) return '5'
  if (zoom >= 12) return '10'
  if (zoom >= 11) return '15'
  if (zoom >= 10) return '20'
  return '25'
}

function zoomByRadius(radius: string): number {
  const r = parseFloat(radius)
  if (isNaN(r)) return 13
  if (r <= 5) return 13
  if (r <= 10) return 12
  if (r <= 15) return 11
  if (r <= 20) return 10
  return 10
}



function isInsideBounds(
  lat: number,
  lng: number,
  bounds: ViewportState['bounds'],
) {
  return (
    lat <= bounds.north &&
    lat >= bounds.south &&
    lng <= bounds.east &&
    lng >= bounds.west
  )
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

function toNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizePoint(point: unknown): [number, number] | null {
  if (Array.isArray(point) && point.length >= 2) {
    const lat = toNumber(point[0])
    const lng = toNumber(point[1])
    return lat !== null && lng !== null && isValidLatLng(lat, lng)
      ? [lat, lng]
      : null
  }

  if (point && typeof point === 'object' && 'lat' in point && 'lng' in point) {
    const p = point as { lat: unknown; lng: unknown }
    const lat = toNumber(p.lat)
    const lng = toNumber(p.lng)
    return lat !== null && lng !== null && isValidLatLng(lat, lng)
      ? [lat, lng]
      : null
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

function resolveSiteCenter(rawSite: ApiSite): [number, number] | null {
  const directLat = toNumber(rawSite.latitude)
  const directLng = toNumber(rawSite.longitude)
  if (
    directLat !== null &&
    directLng !== null &&
    isValidLatLng(directLat, directLng)
  ) {
    return [directLat, directLng]
  }

  const geometry =
    rawSite.geometry && typeof rawSite.geometry === 'object'
      ? (rawSite.geometry as Record<string, unknown>)
      : null

  const center = geometry?.center
  const centerPoint = normalizePoint(center)
  if (centerPoint) return centerPoint

  const legacyToal = normalizePolygonPoints(rawSite.toalPolygonPoints)
  if (legacyToal.length >= 3) {
    return polygonCentroid(legacyToal)
  }

  const geometryPoints = normalizePolygonPoints(geometry?.points)
  if (geometryPoints.length >= 3) {
    return polygonCentroid(geometryPoints)
  }

  return null
}

function normalizeSite(rawSite: ApiSite): DetailedSite | null {
  const center = resolveSiteCenter(rawSite)
  if (!center) return null

  const geometry =
    rawSite.geometry && typeof rawSite.geometry === 'object'
      ? (rawSite.geometry as Record<string, unknown>)
      : null
  const clzGeometry =
    rawSite.clzGeometry && typeof rawSite.clzGeometry === 'object'
      ? (rawSite.clzGeometry as Record<string, unknown>)
      : null

  const toalPts = normalizePolygonPoints(
    rawSite.toalPolygonPoints ?? geometry?.points,
  )
  const emergencyPts = normalizePolygonPoints(
    rawSite.emergencyPolygonPoints ?? clzGeometry?.points,
  )

  const siteType =
    rawSite.siteType === 'emergency' ? 'emergency' : ('toal' as const)
  const statusRaw = String(rawSite.status || '').toLowerCase()

  return {
    id: String(rawSite.id || ''),
    vaId: rawSite.vaId ? String(rawSite.vaId) : undefined,
    name: String(rawSite.name || 'Unnamed Site'),
    category: String(rawSite.category ?? rawSite.siteCategory ?? ''),
    siteType,
    address: String(rawSite.address || ''),
    postcode: String(rawSite.postcode || ''),
    latitude: center[0],
    longitude: center[1],
    toalRadius: toNumber(rawSite.toalRadius ?? geometry?.radius) ?? 0,
    toalGeometryMode:
      rawSite.toalGeometryMode === 'polygon' || geometry?.type === 'polygon'
        ? 'polygon'
        : 'circle',
    toalPolygonPoints: toalPts,
    allowEmergencyLanding: Boolean(
      rawSite.allowEmergencyLanding ?? rawSite.emergencyRecoveryEnabled,
    ),
    emergencyRadius:
      toNumber(rawSite.emergencyRadius ?? clzGeometry?.radius) ?? undefined,
    emergencyGeometryMode:
      rawSite.emergencyGeometryMode === 'polygon' ||
      clzGeometry?.type === 'polygon'
        ? 'polygon'
        : 'circle',
    emergencyPolygonPoints: emergencyPts,
    contactEmail: String(rawSite.contactEmail || ''),
    contactPhone: String(rawSite.contactPhone || ''),
    description: String(rawSite.description || ''),
    photoUrls: [],
    isPermanentActivation: !rawSite.validityEnd,
    activationStartDate: rawSite.validityStart
      ? String(rawSite.validityStart)
      : undefined,
    activationEndDate: rawSite.validityEnd
      ? String(rawSite.validityEnd)
      : undefined,
    activationStartTime: undefined,
    activationEndTime: undefined,
    bookingApprovalModel:
      rawSite.bookingApprovalModel === 'auto' || rawSite.autoApprove === true
        ? 'auto'
        : 'manual',
    policyDocuments: [],
    ownershipDocuments: [],
    toalFee: toNumber(rawSite.toalFee ?? rawSite.toalAccessFee) ?? 0,
    emergencyFee:
      toNumber(
        rawSite.emergencyFee ?? rawSite.clzAccessFee ?? rawSite.toalAccessFee,
      ) ?? 0,
    status:
      statusRaw === 'active'
        ? 'active'
        : statusRaw === 'rejected'
          ? 'rejected'
          : statusRaw === 'disable'
            ? 'disabled'
            : statusRaw === 'temporary_restricted'
              ? 'temporary_unavailable'
              : 'pending',
    createdAt: rawSite.createdAt
      ? String(rawSite.createdAt)
      : new Date().toISOString(),
    submissionDate: undefined,
    approvalDate: undefined,
    rejectionDate: undefined,
    reason: undefined,
  }
}

export default function SearchAndDiscoveryPage() {
  const [filters, setFilters] = React.useState({
    q: '',
    radius: '10',
    siteType: 'all',
    autoApprove: 'all',
    lat: '',
    lng: '',
  })

  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 12,
  })

  const [sites, setSites] = React.useState<DetailedSite[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewport, setViewport] = React.useState<ViewportState | null>(null)

  // State to track which sites are toggled (visible) on the map.
  // By default, all loaded sites are visible.
  const [hiddenSiteIds, setHiddenSiteIds] = React.useState<Set<string>>(
    new Set(),
  )

  // State to trigger map centering and zooming
  const [mapFocus, setMapCenterFocus] = React.useState<{
    center: MapCenter
    zoom: number
    timestamp: number
  } | null>(null)

  const [activeDetailSiteId, setActiveDetailSiteId] = React.useState<string | null>(null)

  const handleNavigateToDetails = React.useCallback((siteId: string) => {
    const site = sites.find(s => s.id === siteId)
    if (site) {
      setMapCenterFocus({
        center: { lat: site.latitude, lng: site.longitude },
        zoom: 15,
        timestamp: Date.now(),
      })
      setActiveDetailSiteId(siteId)
    }
  }, [sites])

  const isZoomEligible = (viewport?.zoom ?? 0) >= MIN_SEARCH_ZOOM

  const handleFilterChange = React.useCallback(
    (updates: Partial<typeof filters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...updates }
        const hasLat = updates.lat !== undefined
        const hasLng = updates.lng !== undefined
        const hasRadius = updates.radius !== undefined

        if ((hasLat && hasLng) || (hasRadius && next.lat && next.lng)) {
          setMapCenterFocus({
            center: {
              lat: parseFloat(hasLat ? (updates.lat as string) : prev.lat),
              lng: parseFloat(hasLng ? (updates.lng as string) : prev.lng),
            },
            zoom: zoomByRadius(next.radius),
            timestamp: Date.now(),
          })
        }
        return next
      })
      setPagination((prev) => ({ ...prev, page: 1 })) // Reset to first page on filter change
    },
    [],
  )

  // Synchronize searching and map centering when filters.q is updated
  React.useEffect(() => {
    if (!filters.q) return

    let active = true

    const resolveQuery = async () => {
      const query = filters.q.trim()

      // 1. Try parsing coordinates
      const coordMatch = query.match(
        /^([-+]?\d{1,2}(?:\.\d+)?)(?:,\s*|\s+)([-+]?\d{1,3}(?:\.\d+)?)$/,
      )
      if (coordMatch && coordMatch[1] && coordMatch[2]) {
        const lat = parseFloat(coordMatch[1])
        const lng = parseFloat(coordMatch[2])
        if (active) {
          setMapCenterFocus({
            center: { lat, lng },
            zoom: 14,
            timestamp: Date.now(),
          })
          setFilters((prev) => ({
            ...prev,
            lat: lat.toString(),
            lng: lng.toString(),
            q: '',
          }))
        }
        return
      }

      // 2. Try Nominatim Geocoding
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'VertiAccess/1.0' } }
        )
        const data = await res.json()
        if (active && data && data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lng = parseFloat(data[0].lon)
          setMapCenterFocus({
            center: { lat, lng },
            zoom: 13,
            timestamp: Date.now(),
          })
          setFilters((prev) => ({
            ...prev,
            lat: lat.toString(),
            lng: lng.toString(),
            q: '',
          }))
          return
        }
      } catch (e) {
        console.error('Nominatim geocoding failed:', e)
      }

      // 3. Try database site search
      try {
        const response = await siteService.searchPublicSites({
          q: query,
          siteType: filters.siteType,
          autoApprove: filters.autoApprove,
        })
        if (active && response.success && response.data && response.data.length > 0) {
          const firstSite = normalizeSite(response.data[0] as ApiSite)
          if (firstSite) {
            setMapCenterFocus({
              center: { lat: firstSite.latitude, lng: firstSite.longitude },
              zoom: 15,
              timestamp: Date.now(),
            })
            setFilters((prev) => ({
              ...prev,
              lat: firstSite.latitude.toString(),
              lng: firstSite.longitude.toString(),
              q: '',
            }))
            return
          }
        }
      } catch (err) {
        console.error('Database site search failed:', err)
      }

      if (active) {
        toast.error(`Location or site "${query}" not found`)
      }
    }

    resolveQuery()

    return () => {
      active = false
    }
  }, [filters.q, filters.siteType, filters.autoApprove])


  // Called from map move/zoom, debounced in map component.
  const handleViewportSearch = React.useCallback((payload: ViewportState) => {
    setViewport(payload)
    setFilters((prev) => ({
      ...prev,
      lat: payload.center.lat.toString(),
      lng: payload.center.lng.toString(),
      radius: radiusByZoom(payload.zoom),
    }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  React.useEffect(() => {
    let active = true

    const fetchSites = async () => {
      if (!viewport || viewport.zoom < MIN_SEARCH_ZOOM) {
        setSites([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await siteService.searchPublicSites({
          ...filters,
          page: pagination.page,
          limit: pagination.limit,
        })

        if (active && response.success) {
          let fetchedSites = response.data

          // Fallback: older/newly created sites may not have PostGIS centerPoint populated yet.
          // Retry without geo params so operators can still browse/book sites on the map.
          if (
            fetchedSites.length === 0 &&
            filters.lat &&
            filters.lng &&
            filters.radius
          ) {
            const fallbackResponse = await siteService.searchPublicSites({
              q: filters.q,
              siteType: filters.siteType,
              autoApprove: filters.autoApprove,
              page: pagination.page,
              limit: pagination.limit,
            })
            if (fallbackResponse.success) {
              fetchedSites = fallbackResponse.data
            }
          }

          const normalizedSites = fetchedSites
            .map((site) => normalizeSite(site as ApiSite))
            .filter((site): site is DetailedSite => site !== null)

          const viewportSites = normalizedSites.filter((site) =>
            isInsideBounds(site.latitude, site.longitude, viewport.bounds),
          )
          setSites(viewportSites)
        }
      } catch (err: unknown) {
        if (active) {
          const message =
            err instanceof Error ? err.message : 'Failed to load sites'
          toast.error(message)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    fetchSites()

    return () => {
      active = false
    }
  }, [filters, pagination.page, pagination.limit, viewport])

  // Filter out sites that are toggled off
  const visibleSites = React.useMemo(() => {
    return sites.filter((site) => !hiddenSiteIds.has(site.id))
  }, [sites, hiddenSiteIds])

  return (
    <div className="flex flex-col flex-1 relative w-full h-full  mx-auto space-y-4 p-4">
      <SearchHeader filters={filters} onFilterChange={handleFilterChange} />

      <div className="flex-1 w-full h-full flex flex-col pt-2 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-full min-h-150 rounded-2xl overflow-hidden border border-border/40 shadow-sm flex-1 flex flex-col lg:flex-row">
          <div className="flex-1 min-h-150">
            <MapView
              sites={visibleSites}
              center={
                mapFocus
                  ? mapFocus.center
                  : filters.lat && filters.lng
                    ? {
                        lat: parseFloat(filters.lat),
                        lng: parseFloat(filters.lng),
                      }
                    : DEFAULT_CENTER
              }
              zoom={mapFocus ? mapFocus.zoom : undefined}
              onViewportSearch={handleViewportSearch}
              onSiteSelect={handleNavigateToDetails}
              isLoading={isLoading}
              isEmpty={
                isZoomEligible && !isLoading && visibleSites.length === 0
              }
            />
          </div>

          <div className="w-full lg:w-90 shrink-0 border-t lg:border-t-0 lg:border-l border-border/50 bg-background/95 flex flex-col h-full min-h-[520px] lg:h-[78vh]">
            {activeDetailSiteId && sites.find(s => s.id === activeDetailSiteId) ? (
              <AssetManagerSiteDetails
                site={sites.find(s => s.id === activeDetailSiteId)!}
                onBack={() => setActiveDetailSiteId(null)}
                className="w-full h-full border-none rounded-none"
              />
            ) : (
              <>
                <div className="px-4 py-3 border-b border-border/50">
                  <h2 className="text-sm font-black uppercase tracking-wider">
                    Assets
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Browse and select available sites for flight planning.
                  </p>
                </div>

                <div className="h-90 lg:h-[calc(100%-62px)] overflow-y-auto">
                  {!isZoomEligible && (
                    <div className="px-4 py-3 text-xs text-muted-foreground border-b border-border/50 bg-muted/20">
                      Zoom in to level {MIN_SEARCH_ZOOM}+ to load assets in this
                      area.
                    </div>
                  )}

                  {sites.length === 0 && !isLoading ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground">
                      {isZoomEligible
                        ? 'No assets found for current viewport.'
                        : 'Assets will load once you zoom in.'}
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {sites.map((site) => {
                        const fee =
                          site.siteType === 'emergency'
                            ? Number(site.emergencyFee || 0)
                            : Number(site.toalFee || 0)

                        const isChecked = !hiddenSiteIds.has(site.id)

                        const handleToggle = (e: React.MouseEvent) => {
                          e.stopPropagation()
                          setHiddenSiteIds((prev) => {
                            const next = new Set(prev)
                            if (next.has(site.id)) {
                              next.delete(site.id)
                            } else {
                              next.add(site.id)
                            }
                            return next
                          })
                        }

                        const handleFocusSite = (e: React.MouseEvent) => {
                          e.preventDefault()
                          setMapCenterFocus({
                            center: { lat: site.latitude, lng: site.longitude },
                            zoom: 15,
                            timestamp: Date.now(),
                          })
                          setActiveDetailSiteId(site.id)
                        }

                        return (
                          <div
                            key={site.id}
                            onClick={handleFocusSite}
                            className="block px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate hover:underline">
                                  {site.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {site.address}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wide">
                                  <MapPin className="h-3 w-3" />
                                  <span>
                                    {site.siteType === 'emergency'
                                      ? 'Emergency'
                                      : 'TOAL'}
                                  </span>
                                  {site.bookingApprovalModel === 'auto' ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600">
                                      <Zap className="h-3 w-3 fill-emerald-600" />{' '}
                                      Auto
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-blue-600">
                                      <Shield className="h-3 w-3" /> Manual
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="flex items-center gap-2">
                                  <div
                                    onClick={handleToggle}
                                    className="flex items-center justify-center p-1 hover:bg-muted rounded cursor-pointer"
                                    title={
                                      isChecked ? 'Hide from map' : 'Show on map'
                                    }
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={() => {}}
                                      className="pointer-events-none"
                                    />
                                  </div>
                                </div>

                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="h-6 text-[10px] font-bold gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleNavigateToDetails(site.id)
                                  }}
                                >
                                  Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
