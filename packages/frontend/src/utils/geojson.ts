import type { GeometryType } from "../types";

interface GenerateGeoJSONParams {
  siteId: string;
  geometryType: GeometryType;
  center: { lat: number; lng: number };
  radius: number;
  polygonPoints: { lat: number; lng: number }[];
  clzEnabled: boolean;
  clzCenter?: { lat: number; lng: number };
  clzRadius?: number;
  clzPolygonPoints?: { lat: number; lng: number }[];
  exportMode?: "TOAL" | "EMERGENCY" | "CLZ"; // Controls which feature to include
}

export function generateGeoJSON(params: GenerateGeoJSONParams) {
  const {
    siteId,
    geometryType,
    center,
    radius,
    polygonPoints,
    clzEnabled,
    clzCenter,
    clzRadius,
    clzPolygonPoints,
    exportMode = "TOAL",
  } = params;

  const features: any[] = [];

  if (exportMode === "TOAL") {
    if (geometryType === "circle") {
      features.push({
        type: "Feature",
        properties: {
          siteId,
          zoneType: "TOAL",
          geometryType: "CIRCLE",
          radius_m: radius,
        },
        geometry: {
          type: "Point",
          coordinates: [center.lng, center.lat],
        },
      });
    } else if (geometryType === "polygon" && polygonPoints.length >= 3) {
      const coordinates = [
        ...polygonPoints.map((p) => [p.lng, p.lat]),
        [polygonPoints[0].lng, polygonPoints[0].lat],
      ];

      features.push({
        type: "Feature",
        properties: {
          siteId,
          zoneType: "TOAL",
          geometryType: "POLYGON",
        },
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      });
    }
  } else if (exportMode === "EMERGENCY" && clzEnabled) {
    if (geometryType === "circle" && clzCenter && clzRadius) {
      features.push({
        type: "Feature",
        properties: {
          siteId,
          zoneType: "EMERGENCY_RECOVERY",
          geometryType: "CIRCLE",
          radius_m: clzRadius,
        },
        geometry: {
          type: "Point",
          coordinates: [clzCenter.lng, clzCenter.lat],
        },
      });
    } else if (
      geometryType === "polygon" &&
      clzPolygonPoints &&
      clzPolygonPoints.length >= 3
    ) {
      const coordinates = [
        ...clzPolygonPoints.map((p) => [p.lng, p.lat]),
        [clzPolygonPoints[0].lng, clzPolygonPoints[0].lat],
      ];

      features.push({
        type: "Feature",
        properties: {
          siteId,
          zoneType: "EMERGENCY_RECOVERY",
          geometryType: "POLYGON",
        },
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      });
    }
  } else if (exportMode === "CLZ" && clzEnabled) {
    if (geometryType === "circle" && clzCenter && clzRadius) {
      features.push({
        type: "Feature",
        properties: {
          siteId,
          zoneType: "CLZ",
          geometryType: "CIRCLE",
          radius_m: clzRadius,
        },
        geometry: {
          type: "Point",
          coordinates: [clzCenter.lng, clzCenter.lat],
        },
      });
    } else if (
      geometryType === "polygon" &&
      clzPolygonPoints &&
      clzPolygonPoints.length >= 3
    ) {
      const coordinates = [
        ...clzPolygonPoints.map((p) => [p.lng, p.lat]),
        [clzPolygonPoints[0].lng, clzPolygonPoints[0].lat],
      ];

      features.push({
        type: "Feature",
        properties: {
          siteId,
          zoneType: "CLZ",
          geometryType: "POLYGON",
        },
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      });
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

export function downloadGeoJSON(geojson: any, filename: string) {
  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
