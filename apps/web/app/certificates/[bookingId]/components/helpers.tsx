'use client';

import * as React from 'react'
import { format } from 'date-fns'
import type { ConsentCertificate } from '@/services/booking.types'
import type { GeometryMode, MapCenter } from '@/components/map/map-types'

export type DisplayStatus = 'VALID' | 'PENDING' | 'REVOKED' | 'EXPIRED'

export interface DetailItemProps {
  label: string
  value: string
  emphasize?: boolean
  icon?: React.ReactNode
}

export function DetailItem({
  label,
  value,
  emphasize = false,
  icon,
}: DetailItemProps) {
  return (
    <div className="flex flex-col gap-1.5 print:gap-0.5">
      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/80 flex items-center gap-1.5 print:text-[8px]">
        {icon && (
          <span className="text-muted-foreground/60 print:hidden">{icon}</span>
        )}
        {label}
      </span>
      <span
        className={
          emphasize
            ? 'text-base font-black leading-tight text-foreground print:text-sm'
            : 'text-sm font-bold leading-snug text-foreground/90 print:text-xs'
        }
      >
        {value}
      </span>
    </div>
  )
}

export function toGeometryMode(geometry: unknown): GeometryMode {
  const geom = geometry as { type?: string } | null | undefined
  return geom?.type === 'polygon' ? 'polygon' : 'circle'
}

interface GeometryWithCenter {
  center?: { lat?: number; lng?: number } | null
  points?: unknown[] | null
}

export function toGeometryCenter(geometry: unknown): MapCenter {
  const geom = geometry as GeometryWithCenter | null | undefined
  const center = geom?.center
  if (
    center &&
    typeof center.lat === 'number' &&
    typeof center.lng === 'number'
  ) {
    return { lat: center.lat, lng: center.lng }
  }

  if (Array.isArray(geom?.points) && geom.points.length > 0) {
    const point = geom.points[0]
    if (Array.isArray(point) && point.length >= 2) {
      const latVal = point[0]
      const lngVal = point[1]
      return { lat: Number(latVal) || 51.505, lng: Number(lngVal) || -0.09 }
    }
  }

  return { lat: 51.505, lng: -0.09 }
}

export function toPolygonPoints(
  geometry: { points?: unknown } | null | undefined,
): [number, number][] {
  if (!geometry || !Array.isArray(geometry.points)) return []
  return geometry.points.filter(
    (point: unknown): point is [number, number] =>
      Array.isArray(point) &&
      point.length >= 2 &&
      typeof point[0] === 'number' &&
      typeof point[1] === 'number',
  )
}

export function getDisplayStatus(
  certificate: ConsentCertificate | null,
  now: Date,
): DisplayStatus {
  if (!certificate) return 'PENDING'
  const status = certificate.consentStatus as string
  if (status === 'REVOKED') return 'REVOKED'
  if (status !== 'APPROVED') return 'PENDING'
  if (now > new Date(certificate.endTime)) return 'EXPIRED'
  return 'VALID'
}

export function extractRadius(cert: ConsentCertificate): number | null {
  const geo = cert.siteGeometry as { radius?: unknown } | null | undefined
  if (geo?.radius && typeof geo.radius === 'number') return geo.radius
  // Fallback: parse the legacy siteGeometrySize string
  if (cert.siteGeometrySize) {
    const m = cert.siteGeometrySize.match(/([\d.]+)\s*m\s*radius/i)
    if (m && typeof m[1] === 'string') return parseFloat(m[1])
  }
  return null
}

export function computePolygonArea(points: [number, number][]): number {
  if (points.length < 3) return 0
  const n = points.length
  const avgLat = points.reduce((s, p) => s + (p[0] ?? 0), 0) / n
  const avgLng = points.reduce((s, p) => s + (p[1] ?? 0), 0) / n
  const latScale = 111320 // metres per degree latitude
  const lngScale = 111320 * Math.cos((avgLat * Math.PI) / 180)
  const projected: [number, number][] = points.map((p) => [
    ((p[1] ?? 0) - avgLng) * lngScale,
    ((p[0] ?? 0) - avgLat) * latScale,
  ])
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const pI = projected[i]
    const pJ = projected[j]
    if (pI && pJ) {
      const pI0 = pI[0] ?? 0
      const pI1 = pI[1] ?? 0
      const pJ0 = pJ[0] ?? 0
      const pJ1 = pJ[1] ?? 0
      area += pI0 * pJ1
      area -= pJ0 * pI1
    }
  }
  return Math.abs(area) / 2
}

export function computeSiteArea(cert: ConsentCertificate): number | null {
  // Prefer radius-based area
  const radius = extractRadius(cert)
  if (radius !== null) return Math.PI * radius * radius
  // Fallback to polygon approximation
  const points = toPolygonPoints(
    cert.siteGeometry as { points?: unknown } | null | undefined,
  )
  if (points.length >= 3) return computePolygonArea(points)
  return null
}

export function formatArea(areaSqM: number): string {
  const ha = areaSqM / 10000
  return `${areaSqM.toLocaleString(undefined, { maximumFractionDigits: 1 })} m² (${ha.toFixed(2)} ha)`
}
