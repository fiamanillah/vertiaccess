'use client';

import * as React from 'react';
import { Search, Crosshair, Loader2, Layers, CheckCheck, Undo2, X, Plus, Minus } from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import type { ActiveBoundary, GeometryMode } from './map-types';

// ─── Search Bar ───────────────────────────────────────────────────────────────

interface MapSearchBarProps {
    onSearch: (query: string) => Promise<void>;
}

export function MapSearchBar({ onSearch }: MapSearchBarProps) {
    const [query, setQuery] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);
    const [error, setError] = React.useState('');

    const run = async () => {
        if (!query.trim()) return;
        setIsSearching(true);
        setError('');
        try { await onSearch(query); }
        catch { setError('Location not found. Try a different address or postcode.'); }
        setIsSearching(false);
    };

    return (
        <div className="bg-background/95 backdrop-blur-sm p-1.5 border border-border rounded-lg shadow-md">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setError(''); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } }}
                        placeholder="Search address, postcode or landmark..."
                        className="pl-9 bg-background/50 border-0 shadow-none focus-visible:ring-1"
                        disabled={isSearching}
                    />
                </div>
                <Button
                    type="button"
                    variant="default"
                    onClick={run}
                    disabled={isSearching || !query.trim()}
                    className="shrink-0 gap-2 shadow-none"
                >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                    {isSearching ? 'Searching…' : 'Locate'}
                </Button>
            </div>
            {error && <p className="text-xs text-destructive mt-1.5 px-2">{error}</p>}
        </div>
    );
}

// ─── Satellite Toggle ─────────────────────────────────────────────────────────

interface SatelliteToggleProps {
    isSatellite: boolean;
    onToggle: () => void;
}

export function SatelliteToggle({ isSatellite, onToggle }: SatelliteToggleProps) {
    return (
        <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onToggle}
            className="bg-background/90 backdrop-blur-sm shadow-sm border border-border hover:bg-background h-8 text-xs font-medium"
        >
            <Layers className="h-3.5 w-3.5 mr-2" />
            {isSatellite ? 'Street View' : 'Satellite'}
        </Button>
    );
}

// ─── Boundary Switcher ────────────────────────────────────────────────────────

interface BoundarySwitcherProps {
    activeBoundary: ActiveBoundary;
    showEmergency: boolean;
    showToal?: boolean;
    onSwitch: (b: ActiveBoundary) => void;
}

export function BoundarySwitcher({ activeBoundary, showEmergency, showToal = true, onSwitch }: BoundarySwitcherProps) {
    if (!showEmergency || !showToal) return null;

    return (
        <div className="flex gap-1 p-0.5 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-sm">
            <button
                type="button"
                onClick={() => onSwitch('toal')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    activeBoundary === 'toal'
                        ? 'bg-[#5b6cf9] text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                TOAL
            </button>
            <button
                type="button"
                onClick={() => onSwitch('emergency')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    activeBoundary === 'emergency'
                        ? 'bg-[#f59e0b] text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                Emergency
            </button>
        </div>
    );
}

// ─── Polygon Toolbar ──────────────────────────────────────────────────────────

interface PolygonToolbarProps {
    geometryMode: GeometryMode;
    polygonPoints: [number, number][];
    isPolygonComplete: boolean;
    activeBoundary: ActiveBoundary;
    onFinish: () => void;
    onUndo: () => void;
    onReset: () => void;
}

export function PolygonToolbar({
    geometryMode,
    polygonPoints,
    isPolygonComplete,
    activeBoundary,
    onFinish,
    onUndo,
    onReset,
}: PolygonToolbarProps) {
    if (geometryMode !== 'polygon') return null;

    const accentColor = activeBoundary === 'toal' ? '#5b6cf9' : '#f59e0b';
    const label = activeBoundary === 'toal' ? 'TOAL' : 'Emergency';

    return (
        <div className="flex flex-col gap-2">
            <Badge
                variant="secondary"
                className="bg-background/90 backdrop-blur-sm border shadow-sm text-xs font-medium"
            >
                {isPolygonComplete
                    ? `✓ ${label} polygon complete (${polygonPoints.length} pts)`
                    : polygonPoints.length === 0
                        ? `Click the map to draw ${label} boundary`
                        : `${polygonPoints.length} pt${polygonPoints.length > 1 ? 's' : ''} — ${polygonPoints.length >= 3 ? 'ready to finish' : `${3 - polygonPoints.length} more needed`}`
                }
            </Badge>

            {!isPolygonComplete && polygonPoints.length > 0 && (
                <div className="flex gap-1.5">
                    {polygonPoints.length >= 3 && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onFinish}
                            style={{ backgroundColor: accentColor }}
                            className="h-8 text-xs font-semibold gap-1.5 shadow-md text-white border-0 hover:opacity-90"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Finish Polygon
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onUndo}
                        className="h-8 text-xs bg-background/90 backdrop-blur-sm border"
                    >
                        <Undo2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}

            {isPolygonComplete && (
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onReset}
                    className="h-8 text-xs bg-background/90 backdrop-blur-sm border gap-1.5"
                >
                    <X className="h-3.5 w-3.5" />
                    Reset
                </Button>
            )}
        </div>
    );
}

// ─── Zoom Controls ────────────────────────────────────────────────────────────

interface ZoomControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut }: ZoomControlsProps) {
    return (
        <div className="flex flex-col gap-0 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={onZoomIn}
                className="flex items-center justify-center w-8 h-8 hover:bg-muted/60 transition-colors text-foreground"
                aria-label="Zoom in"
            >
                <Plus className="h-3.5 w-3.5" />
            </button>
            <div className="h-px bg-border mx-1" />
            <button
                type="button"
                onClick={onZoomOut}
                className="flex items-center justify-center w-8 h-8 hover:bg-muted/60 transition-colors text-foreground"
                aria-label="Zoom out"
            >
                <Minus className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
