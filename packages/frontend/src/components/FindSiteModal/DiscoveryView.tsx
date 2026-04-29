import { motion } from 'motion/react';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Layers,
    Loader2,
    Map as MapIcon,
    MapPin,
    Search,
    Shield,
    AlertCircle,
    Zap,
} from 'lucide-react';
import type { Site } from '../../types';
import { SitesDiscoveryMap } from '../SitesDiscoveryMap';

interface DiscoveryViewProps {
    view: 'list' | 'map';
    searchQuery: string;
    isSearchingSites: boolean;
    hasSearched: boolean;
    filteredSites: Site[];
    onViewChange: (view: 'list' | 'map') => void;
    onSearchQueryChange: (value: string) => void;
    onSearchSites: () => void;
    onResetSearch: () => void;
    onToggleAutoApprove: () => void;
    onToggleCLZ: () => void;
    filterAutoApprove: boolean;
    filterCLZ: boolean;
    onSiteClick: (site: Site) => void;
}

function DiscoverySiteCard({ site, onClick }: { site: Site; onClick: () => void }) {
    const categoryLabel = site.siteCategory
        ?.replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    const typeLabel =
        site.siteType === 'toal' ? 'TOAL' : site.siteType === 'emergency' ? 'Emergency' : 'Unknown';

    const geometryInfo = site.geometry?.radius
        ? `${site.geometry.radius}m`
        : site.geometry?.type === 'polygon'
          ? 'Polygon'
          : 'Custom';

    return (
        <motion.button
            type="button"
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={onClick}
            className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 cursor-pointer hover:border-blue-600/40 transition-all group shadow-sm hover:shadow-lg hover:shadow-blue-500/5 relative overflow-hidden flex flex-col text-left"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-blue-600 transition-colors" />

            <div className="space-y-3 flex-1">
                {/* Title and Type */}
                <div>
                    <h3 className="text-base font-bold text-slate-800 truncate mb-1.5 leading-tight group-hover:text-blue-700 transition-colors">
                        {site.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold uppercase tracking-wide rounded border border-slate-200">
                            {typeLabel}
                        </span>
                        {categoryLabel && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold uppercase tracking-wide rounded border border-blue-100">
                                {categoryLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* Location & Details - Compact Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                            Location
                        </p>
                        <p className="text-slate-700 font-semibold truncate flex items-center gap-1">
                            <MapPin className="size-3 text-slate-400 shrink-0" />
                            <span className="truncate">{site.address}</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                            Zone
                        </p>
                        <p className="text-slate-700 font-semibold">{geometryInfo}</p>
                    </div>
                </div>

                {/* Fee & Status Row */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                            Fee
                        </p>
                        {site.toalAccessFee != null ? (
                            <p className="text-slate-800 font-black">
                                £{Number(site.toalAccessFee).toFixed(2)}
                            </p>
                        ) : (
                            <p className="text-slate-500 font-medium">Contact</p>
                        )}
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                            Status
                        </p>
                        <div className="flex gap-1">
                            <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[8px] font-bold uppercase rounded border border-green-100">
                                Active
                            </span>
                        </div>
                    </div>
                </div>

                {/* Emergency Access Compact */}
                {site.clzEnabled && (
                    <div className="rounded-lg bg-orange-50 border border-orange-200 p-2 flex items-start gap-2">
                        <AlertCircle className="size-3.5 text-orange-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                            <p className="text-[9px] font-bold text-orange-700 uppercase tracking-wide">
                                Emergency Access
                            </p>
                            {site.clzAccessFee != null && (
                                <p className="text-[9px] font-semibold text-orange-800">
                                    £{Number(site.clzAccessFee).toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Features */}
                <div className="flex flex-wrap gap-1.5">
                    {site.autoApprove && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-bold uppercase rounded border border-blue-100 flex items-center gap-0.5">
                            <Zap className="size-2.5" />
                            Auto
                        </span>
                    )}
                    {site.exclusiveUse && (
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[8px] font-bold uppercase rounded border border-purple-100">
                            Exclusive
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-end gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-tight text-blue-600 group-hover:mr-0.5 transition-all">
                    View
                </span>
                <ChevronRight className="size-3.5 text-blue-600" />
            </div>
        </motion.button>
    );
}

export function DiscoveryView({
    view,
    searchQuery,
    isSearchingSites,
    hasSearched,
    filteredSites,
    onViewChange,
    onSearchQueryChange,
    onSearchSites,
    onResetSearch,
    onToggleAutoApprove,
    onToggleCLZ,
    filterAutoApprove,
    filterCLZ,
    onSiteClick,
}: DiscoveryViewProps) {
    return (
        <div className="px-4 sm:px-6 py-5 space-y-5">
            <div className="grid gap-4 lg:grid-cols-[1fr,auto] items-end">
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                        Search UK Infrastructure Network
                    </label>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            void onSearchSites();
                        }}
                        className="flex flex-col sm:flex-row gap-2.5"
                    >
                        <div className="relative group flex-1 min-w-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => onSearchQueryChange(e.target.value)}
                                placeholder="Enter site name, postcode, or address..."
                                className="w-full pl-11 pr-4 h-12 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none shadow-sm transition-all text-sm font-medium"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearchingSites}
                            className="h-12 px-5 rounded-2xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isSearchingSites ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Searching
                                </>
                            ) : (
                                <>
                                    <Search className="size-4" />
                                    Search
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => onViewChange('list')}
                        className={`flex-1 sm:flex-none h-10 px-4 sm:px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${view === 'list' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                        <Layers className="size-4" />
                        List View
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewChange('map')}
                        className={`flex-1 sm:flex-none h-10 px-4 sm:px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${view === 'map' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                        <MapIcon className="size-4" />
                        Map Discovery
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold text-slate-600">
                    {hasSearched
                        ? `Showing ${filteredSites.length} search result${filteredSites.length === 1 ? '' : 's'}`
                        : `Showing ${filteredSites.length} active site${filteredSites.length === 1 ? '' : 's'}`}
                </p>
                {hasSearched && (
                    <button
                        type="button"
                        onClick={onResetSearch}
                        className="text-xs font-bold text-blue-700 hover:text-blue-800 self-start sm:self-auto"
                    >
                        Reset search
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={onToggleAutoApprove}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${filterAutoApprove ? 'bg-[#EAF2FF] border-blue-600 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                    <CheckCircle2 className="size-4" />
                    Auto-Approval Only
                </button>
                <button
                    type="button"
                    onClick={onToggleCLZ}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${filterCLZ ? 'bg-[#FFF7ED] border-[#EA580C] text-[#C2410C] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                    <Shield className="size-4" />
                    Emergency &amp; Recovery
                </button>
            </div>

            {view === 'list' ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 pb-6">
                    {filteredSites.map(site => (
                        <DiscoverySiteCard
                            key={site.id}
                            site={site}
                            onClick={() => onSiteClick(site)}
                        />
                    ))}
                    {filteredSites.length === 0 && (
                        <div className="md:col-span-2 xl:col-span-3 py-16 sm:py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed px-4">
                            <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                                <Search className="size-8 text-slate-300" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">
                                No Infrastructure Found
                            </h4>
                            <p className="text-slate-500 mt-2 font-medium text-sm">
                                Try running another search or adjusting filters.
                            </p>
                            <button
                                type="button"
                                onClick={onResetSearch}
                                className="mt-6 text-blue-600 font-bold hover:underline underline-offset-4"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 min-h-[360px] sm:min-h-[520px] lg:min-h-[620px]">
                    <SitesDiscoveryMap sites={filteredSites} onSiteClick={onSiteClick} />
                    <button
                        type="button"
                        onClick={() => onViewChange('list')}
                        className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-white/90 backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm text-slate-800 border border-slate-200 hover:bg-white transition-all flex items-center gap-2"
                    >
                        <ChevronLeft className="size-4" />
                        Back to List
                    </button>
                </div>
            )}
        </div>
    );
}
