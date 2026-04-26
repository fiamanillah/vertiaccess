import type { Site } from '../../types';

export function calculateSiteArea(geometry: Site['geometry']): number | null {
    if (!geometry) return null;

    if (geometry.type === 'circle') {
        const radius = Number(geometry.radius || 0);
        return radius > 0 ? Math.PI * radius * radius : null;
    }

    const points = geometry.points || [];
    if (points.length < 3) return null;

    const referenceLat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
    const metersPerDegreeLat = 111_320;
    const metersPerDegreeLng = 111_320 * Math.cos((referenceLat * Math.PI) / 180);

    const projected = points.map(point => ({
        x: point.lng * metersPerDegreeLng,
        y: point.lat * metersPerDegreeLat,
    }));

    let area = 0;
    for (let i = 0; i < projected.length; i += 1) {
        const current = projected[i]!;
        const next = projected[(i + 1) % projected.length]!;
        area += current.x * next.y - next.x * current.y;
    }

    return Math.abs(area) / 2;
}

export function formatArea(areaMetersSquared: number | null): string {
    if (!areaMetersSquared || !Number.isFinite(areaMetersSquared) || areaMetersSquared <= 0) {
        return '—';
    }
    const hectares = areaMetersSquared / 10000;
    if (hectares >= 1) {
        return `${hectares.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha`;
    }
    return `${Math.round(areaMetersSquared).toLocaleString()} m²`;
}
