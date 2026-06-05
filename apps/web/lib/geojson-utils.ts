export function downloadGeoJSONFile(filename: string, data: any) {
    if (typeof window === 'undefined') return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function generateGeoJSONFeature(
    mode: 'circle' | 'polygon',
    center: { lat: number; lng: number } | undefined,
    radiusMeters: number,
    polygonPoints: { lat: number; lng: number }[] | [number, number][] | undefined,
    name: string
): any {
    if (mode === 'circle') {
        if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') return null;
        const pointsCount = 64;
        const coords: [number, number][] = [];
        const km = radiusMeters / 1000;
        const latRad = (center.lat * Math.PI) / 180;
        const lngRad = (center.lng * Math.PI) / 180;
        const R = 6378.1; // Earth's radius in km

        for (let i = 0; i <= pointsCount; i++) {
            const theta = (i * 2 * Math.PI) / pointsCount;
            const radial = km / R;
            const latPointRad = Math.asin(
                Math.sin(latRad) * Math.cos(radial) +
                Math.cos(latRad) * Math.sin(radial) * Math.cos(theta)
            );
            const lngPointRad = lngRad + Math.atan2(
                Math.sin(theta) * Math.sin(radial) * Math.cos(latRad),
                Math.cos(radial) - Math.sin(latRad) * Math.sin(latPointRad)
            );
            
            coords.push([
                (lngPointRad * 180) / Math.PI,
                (latPointRad * 180) / Math.PI
            ]);
        }

        return {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [coords]
            },
            properties: {
                name,
                radius: radiusMeters,
                center: [center.lng, center.lat]
            }
        };
    } else {
        if (!polygonPoints || polygonPoints.length === 0) return null;
        
        const coords: [number, number][] = [];
        for (const p of polygonPoints) {
            if (Array.isArray(p)) {
                // Leaflet format: [lat, lng] -> [lng, lat]
                coords.push([p[1], p[0]]);
            } else if (p && typeof p.lat === 'number' && typeof p.lng === 'number') {
                coords.push([p.lng, p.lat]);
            }
        }
        
        // Close the polygon
        if (coords.length > 0) {
            const first = coords[0];
            const last = coords[coords.length - 1];
            if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
                coords.push([first[0], first[1]]);
            }
        }
        
        return {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [coords]
            },
            properties: {
                name
            }
        };
    }
}

export function circleAreaM2(r: number): number {
    return Math.PI * r * r;
}

export function polygonAreaM2(pts: any[] | undefined): number {
    if (!pts || pts.length < 3) return 0;
    const D = 111_320;
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        if (!p1 || !p2) continue;

        const y1 = Array.isArray(p1) ? p1[0] : p1.lat;
        const x1 = Array.isArray(p1) ? p1[1] : p1.lng;
        const y2 = Array.isArray(p2) ? p2[0] : p2.lat;
        const x2 = Array.isArray(p2) ? p2[1] : p2.lng;

        if (typeof y1 !== 'number' || typeof x1 !== 'number' || typeof y2 !== 'number' || typeof x2 !== 'number') {
            continue;
        }

        area += (x2 - x1) * Math.cos(((y1 + y2) / 2) * (Math.PI / 180)) * (y2 - y1);
    }
    return (Math.abs(area) * D * D) / 2;
}

export function formatArea(m2: number): string {
    if (m2 === 0 || isNaN(m2)) return '—';
    return `${Math.round(m2).toLocaleString()} m²`;
}
