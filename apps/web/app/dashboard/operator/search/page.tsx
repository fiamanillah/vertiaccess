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

function radiusByZoom(zoom: number): string {
  if (zoom >= 15) return '2'
  if (zoom >= 14) return '3'
  if (zoom >= 13) return '5'
  if (zoom >= 12) return '8'
  if (zoom >= 11) return '12'
  if (zoom >= 10) return '20'
  return '50'
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

  const isZoomEligible = (viewport?.zoom ?? 0) >= MIN_SEARCH_ZOOM

  const handleFilterChange = React.useCallback(
    (updates: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...updates }))
      setPagination((prev) => ({ ...prev, page: 1 })) // Reset to first page on filter change
    },
    [],
  )

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
          const viewportSites = response.data.filter((site: DetailedSite) =>
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

  return (
    <div className="flex flex-col flex-1 relative w-full h-full max-w-7xl mx-auto space-y-4 p-4">
      <SearchHeader filters={filters} onFilterChange={handleFilterChange} />

      <div className="flex-1 w-full h-full flex flex-col pt-2 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-full min-h-150 rounded-2xl overflow-hidden border border-border/40 shadow-sm flex-1 flex flex-col lg:flex-row">
          <div className="flex-1 min-h-150">
            <MapView
              sites={sites}
              center={
                filters.lat && filters.lng
                  ? {
                      lat: parseFloat(filters.lat),
                      lng: parseFloat(filters.lng),
                    }
                  : DEFAULT_CENTER
              }
              onViewportSearch={handleViewportSearch}
              isLoading={isLoading}
              isEmpty={isZoomEligible && !isLoading && sites.length === 0}
            />
          </div>

          <div className="w-full lg:w-90 shrink-0 border-t lg:border-t-0 lg:border-l border-border/50 bg-background/95">
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

                    return (
                      <Link
                        href={`/dashboard/operator/search/${site.id}`}
                        key={site.id}
                        className="block px-4 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
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
                          <span className="text-xs font-bold whitespace-nowrap">
                            GBP {fee.toFixed(2)}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {!isLoading && sites.length === 0 && (
          <div className="flex flex-col gap-2 items-center justify-center py-6 text-muted-foreground">
            <Search className="h-8 w-8 opacity-30" />
            <p className="text-sm">
              {isZoomEligible
                ? 'No sites found in the current map viewport.'
                : `Zoom in to level ${MIN_SEARCH_ZOOM}+ to search this area.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
