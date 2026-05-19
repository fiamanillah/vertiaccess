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
