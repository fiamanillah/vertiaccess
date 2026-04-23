import { useState, useCallback } from "react";
import type { GeometryType } from "../types";

export interface GeometryState {
  geometryType: GeometryType;
  center: { lat: number; lng: number };
  radius: number;
  clzRadius: number;
  polygonPoints: [number, number][];
  clzPolygonPoints: [number, number][];
  drawingMode: "toal" | "emergency";
}

export interface GeometryActions {
  setGeometryType: (value: GeometryType) => void;
  setCenter: (value: { lat: number; lng: number }) => void;
  setRadius: (value: number) => void;
  setClzRadius: (value: number) => void;
  setPolygonPoints: (value: [number, number][]) => void;
  setClzPolygonPoints: (value: [number, number][]) => void;
  setDrawingMode: (value: "toal" | "emergency") => void;
}

export function useGeometryState(initialState?: Partial<GeometryState>) {
  const [geometryType, setGeometryType] = useState<GeometryType>(
    initialState?.geometryType || "circle",
  );
  const [center, setCenter] = useState(
    initialState?.center || { lat: 51.5074, lng: -0.1278 },
  );
  const [radius, setRadius] = useState(initialState?.radius || 100);
  const [clzRadius, setClzRadius] = useState(initialState?.clzRadius || 200);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>(
    initialState?.polygonPoints || [],
  );
  const [clzPolygonPoints, setClzPolygonPoints] = useState<[number, number][]>(
    initialState?.clzPolygonPoints || [],
  );
  const [drawingMode, setDrawingMode] = useState<"toal" | "emergency">(
    initialState?.drawingMode || "toal",
  );

  const resetGeometry = useCallback(() => {
    setGeometryType("circle");
    setCenter({ lat: 51.5074, lng: -0.1278 });
    setRadius(100);
    setClzRadius(200);
    setPolygonPoints([]);
    setClzPolygonPoints([]);
    setDrawingMode("toal");
  }, []);

  return {
    // State
    geometryType,
    center,
    radius,
    clzRadius,
    polygonPoints,
    clzPolygonPoints,
    drawingMode,

    // Actions
    setGeometryType,
    setCenter,
    setRadius,
    setClzRadius,
    setPolygonPoints,
    setClzPolygonPoints,
    setDrawingMode,

    // Utilities
    resetGeometry,
  };
}
