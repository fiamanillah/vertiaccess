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
    return (
        <motion.button
            type="button"
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={onClick}
            className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 cursor-pointer hover:border-blue-600/40 transition-all group shadow-sm hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden flex flex-col text-left"
        >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-blue-600 transition-colors" />

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:size-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0 relative group-hover:border-blue-100 transition-all">
                    {site.photoUrl || (site.sitePhotos && site.sitePhotos.length > 0) ? (
                        <img
                            src={site.photoUrl || site.sitePhotos?.[0]}
                            alt={site.name}
                            className="w-full h-40 sm:h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-40 sm:h-full flex items-center justify-center">
                            <MapPin className="size-8 text-slate-300 group-hover:text-blue-400 transition-colors" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                            <h3 className="text-lg font-black text-slate-800 truncate mb-0.5 leading-tight group-hover:text-blue-700 transition-colors">
                                {site.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1">
                                <MapPin className="size-3 text-slate-400" />
                                {site.address}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-green-100">
                            Active
                        </span>
                        {site.autoApprove && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100">
                                Auto-Approve
                            </span>
                        )}
                        {site.clzEnabled && (
                            <span className="px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-orange-100">
                                ERS Ready
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between gap-3 text-blue-600">
                <div className="flex items-center gap-2 min-w-0">
                    {site.toalAccessFee != null && (
                        <span className="text-xs font-black text-slate-800">
                            £{Number(site.toalAccessFee).toFixed(2)}
                        </span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                        Access Fee
                    </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest group-hover:mr-1 transition-all">
                        View & Book
                    </span>
                    <ChevronRight className="size-4" />
                </div>
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
                <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 min-h-90 sm:min-h-130 lg:min-h-155">
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
