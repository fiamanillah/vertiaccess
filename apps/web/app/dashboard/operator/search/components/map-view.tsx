import * as React from 'react'
import { SearchMap } from './search-map'
import type { DetailedSite } from '../../../assetmanager/infrastructure/schema'
import { MapCenter } from '@/components/map/map-types'

interface MapViewProps {
  sites: DetailedSite[]
  center: MapCenter
  onLocationPin?: (center: MapCenter) => void
  isLoading?: boolean
  isEmpty?: boolean
}

export function MapView({
  sites,
  center,
  onLocationPin,
  isLoading,
  isEmpty,
}: MapViewProps) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-border/60 shadow-sm relative z-0 flex-1 min-h-[600px]">
      <SearchMap
        sites={sites}
        center={center}
        onLocationPin={onLocationPin}
        isLoading={isLoading}
        isEmpty={isEmpty}
        className="min-h-[600px]"
      />
    </div>
  )
}
