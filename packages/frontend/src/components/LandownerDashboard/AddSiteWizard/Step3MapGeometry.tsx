import { Globe, Loader2, MapPin, Search, X, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { SiteMap } from '../../SiteMap';
import type { GeometryType } from '../../../types';

interface Step3MapGeometryProps {
    geometryType: GeometryType;
    setGeometryType: (value: GeometryType) => void;
    center: { lat: number; lng: number };
    setCenter: (value: { lat: number; lng: number }) => void;
    radius: number;
    setRadius: (value: number) => void;
    clzRadius: number;
    setClzRadius: (value: number) => void;
    polygonPoints: [number, number][];
    setPolygonPoints: (value: [number, number][]) => void;
    clzPolygonPoints: [number, number][];
    setClzPolygonPoints: (value: [number, number][]) => void;
    drawingMode: 'toal' | 'emergency';
    setDrawingMode: (value: 'toal' | 'emergency') => void;
    siteType: 'toal' | 'emergency';
    emergencyRecoveryEnabled: boolean;
    siteCategory: string;
    geometryStats: { area: string; center: string };
    onSiteInformationChange?: (value: string) => void;
    onSitePhotosChange?: (value: string[]) => void;
    onSitePhotoFilesChange?: (value: File[]) => void;
    initialSiteInformation?: string;
    initialSitePhotos?: string[];
    initialSitePhotoFiles?: File[];
}

export function Step3MapGeometry({
    geometryType,
    setGeometryType,
    center,
    setCenter,
    radius,
    setRadius,
    clzRadius,
    setClzRadius,
    polygonPoints,
    setPolygonPoints,
    clzPolygonPoints,
    setClzPolygonPoints,
    drawingMode,
    setDrawingMode,
    siteType,
    emergencyRecoveryEnabled,
    siteCategory,
    geometryStats,
    onSiteInformationChange,
    onSitePhotosChange,
    onSitePhotoFilesChange,
    initialSiteInformation = '',
    initialSitePhotos = [],
    initialSitePhotoFiles = [],
}: Step3MapGeometryProps) {
    // Local state for site information and photos
    const [siteInformation, setSiteInformation] = useState(initialSiteInformation);
    const [sitePhotos, setSitePhotos] = useState(initialSitePhotos);
    const [sitePhotoFiles, setSitePhotoFiles] = useState(initialSitePhotoFiles);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<
        Array<{ display_name: string; lat: string; lon: string }>
    >([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');

    // Sync with parent when values change
    const handleSiteInformationChange = (value: string) => {
        setSiteInformation(value);
        onSiteInformationChange?.(value);
    };

    const handleSitePhotosChange = (value: string[]) => {
        setSitePhotos(value);
        onSitePhotosChange?.(value);
    };

    const handleSitePhotoFilesChange = (value: File[]) => {
        setSitePhotoFiles(value);
        onSitePhotoFilesChange?.(value);
    };

    const handleLocationSearch = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const query = searchQuery.trim();
        if (!query) {
            setSearchResults([]);
            setSearchError('');
            return;
        }

        setSearchLoading(true);
        setSearchError('');

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Location search failed');
            }

            const results = (await response.json()) as Array<{
                display_name: string;
                lat: string;
                lon: string;
            }>;

            setSearchResults(results);
            if (results.length === 0) {
                setSearchError('No matching locations found.');
            }
        } catch {
            setSearchResults([]);
            setSearchError('Unable to search locations right now.');
        } finally {
            setSearchLoading(false);
        }
    };

    const selectSearchResult = (result: { display_name: string; lat: string; lon: string }) => {
        setCenter({ lat: Number(result.lat), lng: Number(result.lon) });
        setSearchQuery(result.display_name);
        setSearchResults([]);
        setSearchError('');
    };

    const circleControls =
        geometryType === 'circle' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(siteType === 'toal' || drawingMode === 'toal') && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-blue-600" />
                            TOAL Radius (Meters)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={radius || ''}
                                onChange={e => {
                                    const val =
                                        parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                                    setRadius(val);
                                }}
                                className="w-full px-4 py-2 bg-white rounded-xl border-2 border-blue-600/30 focus:border-blue-600 transition-all outline-none text-sm font-bold tracking-widest font-mono"
                                placeholder="Enter radius"
                            />
                        </div>
                    </div>
                )}

                {(siteType === 'emergency' || emergencyRecoveryEnabled) && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-amber-500" />
                            Emergency & Recovery Radius (Meters)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={clzRadius || ''}
                                onChange={e => {
                                    const val =
                                        parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                                    setClzRadius(val);
                                }}
                                className="w-full px-4 py-2 bg-white rounded-xl border-2 border-amber-500/30 focus:border-amber-500 transition-all outline-none text-sm font-bold tracking-widest font-mono"
                                placeholder="Enter radius"
                            />
                        </div>
                        {siteType === 'toal' &&
                            emergencyRecoveryEnabled &&
                            clzRadius <= radius &&
                            clzRadius > 0 && (
                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest animate-pulse mt-1">
                                    Notice: Emergency zone should typically be larger than TOAL
                                </p>
                            )}
                    </div>
                )}
            </div>
        ) : null;
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Globe className="size-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Map & Boundary</h2>
                    <p className="text-sm text-slate-500">
                        Define the exact operational area for this infrastructure.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Geometry Type
                        </label>
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-full max-w-[320px]">
                            <button
                                type="button"
                                onClick={() => setGeometryType('circle')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                                    geometryType === 'circle'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                Circular
                            </button>
                            <button
                                type="button"
                                onClick={() => setGeometryType('polygon')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                                    geometryType === 'polygon'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                Polygon
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 italic px-1">
                        {siteType === 'toal' && emergencyRecoveryEnabled
                            ? 'Click on the map to define your TOAL (Take-off & Landing) and Emergency Recovery boundary.'
                            : drawingMode === 'toal'
                              ? 'Click on the map to define your TOAL (Take-off & Landing) boundary.'
                              : 'Click on the map to define your Emergency Recovery boundary.'}
                    </p>

                    <div className="space-y-4">
                        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur-md lg:grid-cols-[1.4fr_1fr]">
                            <form onSubmit={handleLocationSearch} className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Search className="size-3.5 text-blue-600" />
                                    Search Location
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search a town, postcode, or address"
                                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-blue-600 focus:bg-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={searchLoading}
                                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {searchLoading ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            'Search'
                                        )}
                                    </button>
                                </div>
                                {searchError && (
                                    <p className="text-xs font-medium text-rose-600">
                                        {searchError}
                                    </p>
                                )}

                                {searchResults.length > 0 && (
                                    <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-2">
                                        {searchResults.map(result => (
                                            <button
                                                key={`${result.lat}-${result.lon}`}
                                                type="button"
                                                onClick={() => selectSearchResult(result)}
                                                className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-all hover:bg-white"
                                            >
                                                <MapPin className="mt-0.5 size-4 shrink-0 text-blue-600" />
                                                <span className="line-clamp-2 text-sm text-slate-700">
                                                    {result.display_name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </form>

                            <div className="space-y-3">{circleControls}</div>
                        </div>

                        <p className="text-[10px] font-medium text-slate-400 px-1">
                            Click anywhere on the map to place or move the marker.
                        </p>

                        <div
                            className="w-full relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl group"
                            style={{ height: '500px' }}
                        >
                            {/* Debug info */}
                            <div className="absolute top-2 left-2 z-50 bg-black/80 text-white text-xs p-2 rounded">
                                Debug: geometryType={geometryType}, center=
                                {JSON.stringify(center)}, radius={radius}
                            </div>
                            <SiteMap
                                geometryType={geometryType}
                                center={center}
                                radius={radius}
                                polygonPoints={polygonPoints.map(([lat, lng]) => ({ lat, lng }))}
                                onCenterChange={setCenter}
                                onPolygonPointsChange={points =>
                                    setPolygonPoints(
                                        points.map(({ lat, lng }) => [lat, lng] as [number, number])
                                    )
                                }
                                clzEnabled={siteType === 'toal' && emergencyRecoveryEnabled}
                                clzPolygonPoints={clzPolygonPoints.map(([lat, lng]) => ({
                                    lat,
                                    lng,
                                }))}
                                onClzPolygonPointsChange={points =>
                                    setClzPolygonPoints(
                                        points.map(({ lat, lng }) => [lat, lng] as [number, number])
                                    )
                                }
                                drawingMode={drawingMode}
                                clzRadius={clzRadius}
                                clzOnly={siteType === 'emergency'}
                                siteCategory={siteCategory}
                            />

                            {/* Floating Drawing Switcher for Emergency+TOAL */}
                            {siteType === 'toal' &&
                                emergencyRecoveryEnabled &&
                                geometryType === 'polygon' && (
                                    <div className="absolute top-4 left-4 flex bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-2xl border border-slate-200 z-[1000]">
                                        <button
                                            onClick={() => setDrawingMode('toal')}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 uppercase tracking-widest ${
                                                drawingMode === 'toal'
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div
                                                className={`size-1.5 rounded-full ${drawingMode === 'toal' ? 'bg-white' : 'bg-blue-600'}`}
                                            />
                                            Draw TOAL
                                        </button>
                                        <button
                                            onClick={() => setDrawingMode('emergency')}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 uppercase tracking-widest ${
                                                drawingMode === 'emergency'
                                                    ? 'bg-amber-500 text-white shadow-lg'
                                                    : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div
                                                className={`size-1.5 rounded-full ${drawingMode === 'emergency' ? 'bg-white' : 'bg-amber-500'}`}
                                            />
                                            Draw Emergency & Recovery
                                        </button>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Live Summary - Styled as per image */}
                    <div className="grid grid-cols-2 gap-0 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden divide-x divide-slate-100">
                        <div className="p-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Calculated Area
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                                {geometryStats.area} m²
                            </p>
                        </div>
                        <div className="p-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Center Point
                            </p>
                            <p className="text-sm font-medium text-slate-600">
                                {geometryStats.center}
                            </p>
                        </div>
                    </div>

                    {/* New Section: Property Details & Photos */}
                    <div className="space-y-6 pt-4 border-t border-slate-100">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">
                                Property Description *
                            </label>
                            <textarea
                                value={siteInformation}
                                onChange={e => handleSiteInformationChange(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-300 min-h-30 bg-slate-50/30"
                                placeholder="Detail any specific hazards, ground surface (e.g. concrete, grass), and access instructions for operators."
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700">
                                Upload Site Photos
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {sitePhotos.map((photo, idx) => (
                                    <div
                                        key={idx}
                                        className="aspect-square relative rounded-xl overflow-hidden border border-slate-200 group"
                                    >
                                        <img
                                            src={photo}
                                            alt={`Site ${idx}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => {
                                                handleSitePhotosChange(
                                                    sitePhotos.filter((_, i) => i !== idx)
                                                );
                                                handleSitePhotoFilesChange(
                                                    sitePhotoFiles.filter((_, i) => i !== idx)
                                                );
                                            }}
                                            className="absolute top-1 right-1 size-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-600/30 transition-all cursor-pointer">
                                    <Plus className="size-6 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-2">
                                        Add Photo
                                    </span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => {
                                            const files = e.target.files;
                                            if (files) {
                                                const selectedFiles = Array.from(files);
                                                const newPhotos = selectedFiles.map(f =>
                                                    URL.createObjectURL(f)
                                                );
                                                handleSitePhotosChange([
                                                    ...sitePhotos,
                                                    ...newPhotos,
                                                ]);
                                                handleSitePhotoFilesChange([
                                                    ...sitePhotoFiles,
                                                    ...selectedFiles,
                                                ]);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-slate-400">
                                Add multiple photos to help operators identify the landing area and
                                surroundings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
