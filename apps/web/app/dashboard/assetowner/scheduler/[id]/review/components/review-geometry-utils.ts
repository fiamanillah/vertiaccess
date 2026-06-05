// ─── Geometry Helper Functions ─────────────────────────────────────────────────

export function toGeometryMode(geometry: any) {
  const geom = geometry as { type?: string } | null | undefined
  return geom?.type === 'polygon' ? 'polygon' : 'circle'
}

export function toGeometryCenter(geometry: any) {
  const geom = geometry as
    | {
        type?: string
        center?: { lat?: number; lng?: number } | null
        points?: any[] | null
      }
    | null
    | undefined

  // For polygon geometry, compute centroid from the actual polygon points
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

  // For circle geometry or fallback, use the stored center
  const center = geom?.center
  if (
    center &&
    typeof center.lat === 'number' &&
    typeof center.lng === 'number'
  ) {
    return { lat: center.lat, lng: center.lng }
  }

  return { lat: 51.505, lng: -0.09 }
}

export function toPolygonPoints(geometry: any): [number, number][] {
  if (!geometry || !Array.isArray(geometry.points)) return []
  return geometry.points
    .map((point: any): [number, number] | null => {
      // Handle { lat, lng } object format (from backend)
      if (
        point &&
        typeof point === 'object' &&
        !Array.isArray(point) &&
        typeof point.lat === 'number' &&
        typeof point.lng === 'number'
      ) {
        return [point.lat, point.lng]
      }
      // Handle [lat, lng] tuple format (legacy)
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

export function formatBoundarySummary(
  mode: 'circle' | 'polygon',
  radius: number,
  points: [number, number][],
) {
  if (mode === 'polygon') {
    return `Polygon - ${points.length} point${points.length === 1 ? '' : 's'} defined`
  }
  return `Circle - ${radius.toLocaleString()} m radius`
}
