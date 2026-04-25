import { useState } from 'react';
import type { Site } from '../../types';
import { MapPin, Shield, ChevronRight, Info } from 'lucide-react';
import { SITE_STATUS_META, SITE_STATUS_VALUES, normalizeSiteStatus } from '../../lib/site-status';
import { Spinner } from '../ui/spinner';

interface SitesTableProps {
    sites: Site[];
    loading?: boolean;
    onSiteStatusChange: (site: Site) => void;
    onSiteDetails: (site: Site) => void;
    onAddSite?: () => void;
}

export function SitesTable({
    sites,
    loading = false,
    onSiteStatusChange,
    onSiteDetails,
    onAddSite,
}: SitesTableProps) {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const activeSites = sites.filter(s => normalizeSiteStatus(s.status) === 'ACTIVE').length;

    const filteredSites =
        statusFilter === 'all'
            ? sites
            : sites.filter(site => normalizeSiteStatus(site.status) === statusFilter);

    const statusFilters = [
        { id: 'all', label: 'All Sites', count: sites.length },
        ...SITE_STATUS_VALUES.map(status => ({
            id: status,
            label: SITE_STATUS_META[status].label,
            count: sites.filter(site => normalizeSiteStatus(site.status) === status).length,
        })),
    ];

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
                <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                    <Spinner size="lg" className="text-blue-500" aria-label="Loading sites" />
                    <p className="text-sm font-medium">Loading sites...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {sites.length === 0 ? (
                <div className="text-center py-12">
                    <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MapPin className="size-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        You have not added any sites yet
                    </h3>
                    <p className="text-slate-600 max-w-md mx-auto mb-8">
                        Add your first TOAL or Emergency and Recovery Site to start receiving
                        booking requests from drone operators.
                    </p>
                    <button
                        onClick={onAddSite}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0039CC] transition-colors shadow-sm flex items-center gap-2 mx-auto"
                    >
                        Add Your First Site
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Status Filter Buttons */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex flex-wrap gap-2">
                            {statusFilters.map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setStatusFilter(filter.id)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                                        statusFilter === filter.id
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {filter.label}
                                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-black/10">
                                        {filter.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Site
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Infrastructure
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Validity
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSites.map(site =>
                                (() => {
                                    const currentStatus = normalizeSiteStatus(site.status);

                                    return (
                                        <tr
                                            key={site.id}
                                            className="hover:bg-slate-50 transition-colors group"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="size-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors">
                                                        <MapPin className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">
                                                            {site.name}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {site.address}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${SITE_STATUS_META[currentStatus].badgeClass}`}
                                                    >
                                                        {SITE_STATUS_META[currentStatus].shortLabel}
                                                    </span>
                                                    {site.adminNote && (
                                                        <div className="group relative flex items-center cursor-help">
                                                            <div className="size-5 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition-colors">
                                                                <Info className="size-3" />
                                                            </div>
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] p-2.5 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg shadow-xl z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none whitespace-normal">
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-slate-900" />
                                                                <p className="font-bold text-slate-200 mb-0.5 uppercase tracking-wider text-[9px]">Admin Note</p>
                                                                <p className="font-medium leading-relaxed">{site.adminNote}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight">
                                                        TOAL
                                                    </span>
                                                    {site.clzEnabled && (
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight">
                                                            Emergency and Recovery Site
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">
                                                        {new Date(
                                                            site.validityStart
                                                        ).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                    {site.validityEnd ? (
                                                        <span className="text-slate-500 text-xs">
                                                            to{' '}
                                                            {new Date(
                                                                site.validityEnd
                                                            ).toLocaleDateString('en-GB', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-blue-600 text-xs font-bold flex items-center gap-1">
                                                            <Info className="size-3" />
                                                            <span className="text-base leading-none">
                                                                ∞
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => onSiteStatusChange(site)}
                                                        disabled={currentStatus === 'UNDER_REVIEW'}
                                                        className={`transition-colors p-1 ${
                                                            currentStatus === 'UNDER_REVIEW'
                                                                ? 'text-slate-200 cursor-not-allowed'
                                                                : 'text-slate-400 hover:text-blue-600'
                                                        }`}
                                                        title={
                                                            currentStatus === 'UNDER_REVIEW'
                                                                ? 'Verification in progress'
                                                                : 'Change Status'
                                                        }
                                                    >
                                                        <Shield className="size-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => onSiteDetails(site)}
                                                        className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <ChevronRight className="size-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })()
                            )}
                        </tbody>
                    </table>

                    {/* No results message for filtered view */}
                    {filteredSites.length === 0 && sites.length > 0 && (
                        <div className="p-12 text-center">
                            <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="size-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                No sites found
                            </h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                No sites match the selected status filter. Try selecting a different
                                filter.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
