'use client'

import * as React from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'
import { Button } from '@workspace/ui/components/button'
import { PreviewMap } from '@/components/map/preview-map'
import {
  Info,
  FileText,
  ExternalLink,
  CalendarDays,
  MapPin,
  Zap,
  Shield,
  Download,
} from 'lucide-react'
import {
  generateGeoJSONFeature,
  downloadGeoJSONFile,
} from '@/lib/geojson-utils'

interface SiteDetailsContextProps {
  site: any
}

function calculateGeodesicArea(points: { lat: number; lng: number }[]): number {
  if (!points || points.length < 3) return 0

  // Find centroid to use as center of flat coordinate projection
  let sumLat = 0
  let sumLng = 0
  for (const p of points) {
    sumLat += p.lat
    sumLng += p.lng
  }
  const lat0 = sumLat / points.length

  // Constants for flat projection (meters per degree)
  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos((lat0 * Math.PI) / 180)

  // Project to flat coordinates in meters
  const projected = points.map((p) => ({
    x: p.lng * metersPerDegreeLng,
    y: p.lat * metersPerDegreeLat,
  }))

  // Standard Shoelace formula
  let area = 0
  const n = projected.length
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n
    const currPoint = projected[i]
    const nextPoint = projected[next]
    if (currPoint && nextPoint) {
      area += currPoint.x * nextPoint.y - nextPoint.x * currPoint.y
    }
  }

  return Math.abs(area) / 2
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

function polygonCentroid(
  points: [number, number][],
): { lat: number; lng: number } | null {
  if (points.length === 0) return null
  const sum = points.reduce(
    (acc, [lat, lng]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
    { lat: 0, lng: 0 },
  )
  const lat = sum.lat / points.length
  const lng = sum.lng / points.length
  return isValidLatLng(lat, lng) ? { lat, lng } : null
}

function normalizeGeometryMode(mode: unknown): 'circle' | 'polygon' {
  return String(mode || 'circle').toLowerCase() === 'polygon'
    ? 'polygon'
    : 'circle'
}

function getAreaFormatted(
  mode: string,
  radius: number,
  points: { lat: number; lng: number }[],
): string {
  let areaM2 = 0
  if (mode === 'circle') {
    areaM2 = Math.PI * Math.pow(radius, 2)
  } else {
    areaM2 = calculateGeodesicArea(points)
  }

  if (areaM2 === 0) return 'N/A'

  // Display in m² or hectares (ha)
  if (areaM2 >= 10000) {
    const ha = areaM2 / 10000
    return `${Math.round(areaM2).toLocaleString()} m² (${ha.toFixed(2)} ha)`
  }
  return `${Math.round(areaM2).toLocaleString()} m²`
}

function formatLabel(value?: string | null): string {
  if (!value) return 'N/A'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatAvailability(site: any): string {
  const isPermanent =
    site.isPermanentActivation === true ||
    site.permanentActivation === true ||
    (!site.validityEnd && !site.activationEndDate && !site.endDate)

  if (isPermanent) return 'Permanent'

  const start =
    site.validityStart || site.activationStartDate || site.startDate || null
  const end = site.validityEnd || site.activationEndDate || site.endDate || null

  return `${formatDateTime(start)} to ${formatDateTime(end)}`
}

function formatCurrency(value?: number | null): string {
  const amount = Number(value || 0)
  return `£${amount.toFixed(2)}`
}

function getGeometryType(mode?: string | null): string {
  if (!mode) return 'N/A'
  return mode.toLowerCase() === 'polygon' ? 'Polygon' : 'Circle'
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-border/50 last:border-b-0">
      <p className="text-sm font-semibold tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="sm:col-span-2 text-sm font-medium text-foreground wrap-break-word">
        {value}
      </div>
    </div>
  )
}

export function SiteDetailsContext({ site }: SiteDetailsContextProps) {
  const isAuto = site.autoApprove === true
  const formattedCategory = site.siteCategory
    ? site.siteCategory.replace(/_/g, ' ')
    : ''

  // Geometry parsing for the map
  const lat = site.geometry?.center?.lat || site.latitude || 51.5072
  const lng = site.geometry?.center?.lng || site.longitude || -0.1276
  const toalRadius = site.geometry?.radius ?? site.toalRadius ?? 100
  const emergencyRadius = site.clzGeometry?.radius ?? site.emergencyRadius ?? 0
  const toalMode = normalizeGeometryMode(
    site.geometry?.type ?? site.toalGeometryMode,
  )
  const emergencyMode = normalizeGeometryMode(
    site.clzGeometry?.type ?? site.emergencyGeometryMode,
  )
  const toalPolygonPoints =
    site.geometry?.points ?? site.toalPolygonPoints ?? []
  const emergencyPolygonPoints =
    site.clzGeometry?.points ?? site.emergencyPolygonPoints ?? []
  const normalizedToalPolygonPoints = normalizePolygonPoints(toalPolygonPoints)
  const normalizedEmergencyPolygonPoints = normalizePolygonPoints(
    emergencyPolygonPoints,
  )

  const mapCenter = (site.geometry?.center &&
  isValidLatLng(site.geometry.center.lat, site.geometry.center.lng)
    ? { lat: site.geometry.center.lat, lng: site.geometry.center.lng }
    : null) ||
    polygonCentroid(normalizedToalPolygonPoints) ||
    polygonCentroid(normalizedEmergencyPolygonPoints) || { lat, lng }

  const assetId = site.vaId || site.assetId || site.id || 'N/A'
  const assetType = formatLabel(
    site.siteCategory || site.category || site.assetType,
  )
  const assetCapability = formatLabel(
    site.capability || site.siteCapability || site.siteType,
  )
  const assetStatus = formatLabel(site.status)
  const assetAddress =
    [site.address, site.postcode].filter(Boolean).join(', ') || 'N/A'
  const assetDescription =
    site.description || site.siteInformation || 'No description provided.'

  const policyDocuments =
    site.documents?.filter((d: any) => d.documentType === 'policy') || []
  const approvalMode = isAuto ? 'Auto Approval' : 'Manual Review'

  const toalFee = site.toalAccessFee ?? site.toalFee
  const emergencyFee = site.clzAccessFee ?? site.emergencyFee
  const emergencyLandingAllowed =
    site.clzEnabled === true ||
    site.allowEmergencyLanding === true ||
    site.emergencyRecoveryEnabled === true
  const showEmergency = emergencyLandingAllowed

  const handleDownloadGeoJSON = (type: 'toal' | 'emergency') => {
    const mode = type === 'toal' ? toalMode : emergencyMode
    const radius = type === 'toal' ? toalRadius : emergencyRadius
    const points = type === 'toal' ? toalPolygonPoints : emergencyPolygonPoints
    const name =
      type === 'toal'
        ? `${site.name} - TOAL Zone`
        : `${site.name} - Emergency & Recovery Zone`
    const center = site.geometry?.center || { lat, lng }

    const geojson = generateGeoJSONFeature(
      mode as 'circle' | 'polygon',
      center,
      radius,
      points,
      name,
    )
    if (geojson) {
      const filenameType = type === 'toal' ? 'toal' : 'emergency_and_recovery'
      downloadGeoJSONFile(
        `${site.name.toLowerCase().replace(/\s+/g, '_')}_${filenameType}_boundary.geojson`,
        geojson,
      )
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Header */}
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {formattedCategory && (
              <Badge
                variant="outline"
                className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider font-bold text-[10px] px-3 py-1"
              >
                {formattedCategory}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 uppercase tracking-wider font-bold text-[10px] px-3 py-1"
            >
              {site.status}
            </Badge>
            {site.clzEnabled && (
              <Badge
                variant="outline"
                className="text-amber-500 border-amber-500/20 bg-amber-500/5 uppercase tracking-wider font-bold text-[10px] px-3 py-1"
              >
                Emergency Landing Allowed
              </Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {site.name}
          </h1>
        </div>
      </section>

      {/* 2. Asset Details */}
      <section className="p-5 rounded-2xl border border-border/60 bg-background space-y-2">
        <h2 className="text-xl font-bold tracking-tight">Asset Details</h2>
        <FieldRow label="Asset ID" value={String(assetId).toUpperCase()} />
        <FieldRow label="Asset Name" value={site.name || 'N/A'} />
        <FieldRow label="Asset Type" value={assetType} />
        <FieldRow label="Asset Capability" value={assetCapability} />
        <FieldRow label="Asset Status" value={assetStatus} />
        <FieldRow label="Asset Address" value={assetAddress} />
        <FieldRow label="Asset Description" value={assetDescription} />
      </section>

      {/* 3. Asset Geometry */}
      <section className="bg-background space-y-3">
        <h2 className="text-xl font-bold tracking-tight w-full">
          Asset Geometry
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 items-stretch">
          <div
            className={`rounded-2xl border border-primary/20 bg-primary/5 p-4 h-full flex flex-col ${
              emergencyLandingAllowed ? 'md:col-span-1' : 'md:col-span-2'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-primary/20">
              <p className="text-sm font-bold text-primary">TOAL</p>
              <span className="text-xs font-semibold text-primary/80 bg-primary/10 px-2 py-1 rounded-md">
                Primary Zone
              </span>
            </div>

            <div className="space-y-3 py-3 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-muted-foreground">
                  Area
                </p>
                <p className="text-sm font-medium text-foreground text-right">
                  {getAreaFormatted(toalMode, toalRadius, toalPolygonPoints)}
                </p>
              </div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-muted-foreground">
                  Type
                </p>
                <p className="text-sm font-medium text-foreground text-right">
                  {getGeometryType(toalMode)}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-primary/20 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-muted-foreground">
                GeoJSON File
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-primary/30 ml-auto"
                onClick={() => handleDownloadGeoJSON('toal')}
              >
                <Download className="h-4 w-4" />
                Download TOAL
              </Button>
            </div>
          </div>

          {emergencyLandingAllowed && (
            <div className="rounded-2xl border border-amber-300/70 bg-amber-50 p-4 h-full flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-amber-300/70">
                <p className="text-sm font-bold text-amber-700">Emergency</p>
                <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-1 rounded-md">
                  Recovery Zone
                </span>
              </div>

              <div className="space-y-3 py-3 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-amber-700/80">
                    Area
                  </p>
                  <p className="text-sm font-medium text-foreground text-right">
                    {getAreaFormatted(
                      emergencyMode,
                      emergencyRadius,
                      emergencyPolygonPoints,
                    )}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-amber-700/80">
                    Type
                  </p>
                  <p className="text-sm font-medium text-foreground text-right">
                    {getGeometryType(emergencyMode)}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-amber-300/70 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-amber-700/80">
                  GeoJSON File
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100 ml-auto"
                  onClick={() => handleDownloadGeoJSON('emergency')}
                >
                  <Download className="h-4 w-4" />
                  Download Emergency
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl overflow-hidden border border-border/50 shadow-sm mt-1">
          <PreviewMap
            center={mapCenter}
            toalRadius={toalRadius}
            emergencyRadius={emergencyRadius}
            showEmergency={emergencyLandingAllowed}
            toalMode={toalMode}
            emergencyMode={emergencyMode}
            initialToalPolygonPoints={normalizedToalPolygonPoints}
            initialEmergencyPolygonPoints={normalizedEmergencyPolygonPoints}
            className="h-80"
          />
        </div>
      </section>

      {/* 4. Availability & Policy */}
      <section className="p-5 rounded-2xl border border-border/60 bg-background space-y-2">
        <h2 className="text-xl font-bold tracking-tight">
          Availability &amp; Policy
        </h2>
        <FieldRow
          label="Availability"
          value={
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>{formatAvailability(site)}</span>
            </div>
          }
        />
        <FieldRow
          label="Approval Mode"
          value={
            <div className="inline-flex items-center gap-2">
              {isAuto ? (
                <Zap className="h-4 w-4 text-emerald-500" />
              ) : (
                <Shield className="h-4 w-4 text-amber-500" />
              )}
              <span>{approvalMode}</span>
            </div>
          }
        />
        <FieldRow
          label="Policy"
          value={
            policyDocuments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {policyDocuments.map((doc: any, idx: number) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      doc.downloadUrl
                        ? window.open(doc.downloadUrl, '_blank')
                        : null
                    }
                  >
                    <FileText className="h-4 w-4" />
                    <span className="max-w-55 truncate">
                      {doc.fileName || 'Policy Document'}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                ))}
              </div>
            ) : (
              'No downloadable policy document available.'
            )
          }
        />
      </section>

      {/* 5. Commercials */}
      <section className="p-5 rounded-2xl border border-border/60 bg-background space-y-2">
        <h2 className="text-xl font-bold tracking-tight">Commercials</h2>
        <FieldRow label="TOAL Access Fee" value={formatCurrency(toalFee)} />
        {showEmergency && (
          <FieldRow
            label="Emergency & Recovery Site Fee"
            value={formatCurrency(emergencyFee)}
          />
        )}
      </section>

      <Separator />
    </div>
  )
}
