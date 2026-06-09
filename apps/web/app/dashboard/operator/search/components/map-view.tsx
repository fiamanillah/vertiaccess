import * as React from 'react'
import { SearchMap } from './search-map'
import type { DetailedSite } from '../../../assetmanager/infrastructure/schema'
import { MapCenter } from '@/components/map/map-types'

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

interface MapViewProps {
  sites: DetailedSite[]
  center: MapCenter
  zoom?: number
  onViewportSearch?: (payload: ViewportSearchPayload) => void
  isLoading?: boolean
  isEmpty?: boolean
}

export function MapView({
  sites,
  center,
  zoom,
  onViewportSearch,
  isLoading,
  isEmpty,
}: MapViewProps) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-border/60 shadow-sm relative z-0 flex-1 min-h-150">
      <SearchMap
        sites={sites}
        center={center}
        zoom={zoom}
        onViewportSearch={onViewportSearch}
        isLoading={isLoading}
        isEmpty={isEmpty}
        className="min-h-150"
      />
    </div>
  )
}
