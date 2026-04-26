import type { Site } from '../../types';
import { SectionTitle } from './SectionTitle';
import { SiteMap } from '../SiteMap';

interface SpatialLayoutSectionProps {
    site: Site;
    isEditing: boolean;
    isAdminMode: boolean;
    geometry: Site['geometry'];
    setGeometry: React.Dispatch<React.SetStateAction<Site['geometry']>>;
    clzGeometry: Site['clzGeometry'];
    setClzGeometry: React.Dispatch<React.SetStateAction<Site['clzGeometry']>>;
    clzEnabled: boolean;
    mapCenter: { lat: number; lng: number };
}

export function SpatialLayoutSection({
    site,
    isEditing,
    isAdminMode,
    geometry,
    setGeometry,
    clzGeometry,
    setClzGeometry,
    clzEnabled,
    mapCenter,
}: SpatialLayoutSectionProps) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <SectionTitle>Spatial Layout</SectionTitle>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 relative h-64 bg-slate-100 shadow-inner">
                <SiteMap
                    geometryType={geometry.type || 'circle'}
                    center={mapCenter}
                    radius={geometry.radius || 50}
                    polygonPoints={geometry.points || []}
                    onCenterChange={center => setGeometry(prev => ({ ...prev, center }))}
                    onPolygonPointsChange={points => setGeometry(prev => ({ ...prev, points }))}
                    clzEnabled={isEditing ? clzEnabled : site.clzEnabled}
                    clzPolygonPoints={clzGeometry?.points || []}
                    onClzPolygonPointsChange={points =>
                        setClzGeometry(prev => ({
                            ...prev,
                            type: prev?.type || 'polygon',
                            points,
                        }))
                    }
                    clzRadius={clzGeometry?.radius || 150}
                    readonly={isAdminMode || !isEditing}
                />
                <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-lg space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-blue-600" />
                        <span className="text-[9px] font-black text-slate-800 uppercase">
                            TOAL ZONE
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full border-2 border-[#F59E0B] bg-transparent" />
                        <span className="text-[9px] font-black text-slate-800 uppercase">
                            Emergency & Recovery Site
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
