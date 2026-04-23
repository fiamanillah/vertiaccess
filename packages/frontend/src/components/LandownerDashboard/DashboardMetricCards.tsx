import {
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle,
    Clock,
    Globe,
    PoundSterling,
    TrendingUp,
} from 'lucide-react';
import { Spinner } from '../ui/spinner';

interface DashboardMetricCardsProps {
    sitesLoading: boolean;
    bookingMetricsLoading: boolean;
    revenueLoading: boolean;
    totalSites: number;
    activeSites: number;
    pendingRequestsCount: number;
    totalRevenue: number;
    revenueTrendPercent: number;
}

function StatValueSpinner() {
    return (
        <div className="h-9 flex items-center mt-1">
            <Spinner size="sm" className="text-slate-400" aria-label="Loading metric" />
        </div>
    );
}

export function DashboardMetricCards({
    sitesLoading,
    bookingMetricsLoading,
    revenueLoading,
    totalSites,
    activeSites,
    pendingRequestsCount,
    totalRevenue,
    revenueTrendPercent,
}: DashboardMetricCardsProps) {
    const isRevenueUp = revenueTrendPercent >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Globe className="size-5 text-blue-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Sites</p>
                {sitesLoading ? (
                    <StatValueSpinner />
                ) : (
                    <p className="text-3xl font-bold text-slate-900 mt-1">{totalSites}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">Across all regions</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="size-5 text-blue-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Active Sites</p>
                {sitesLoading ? (
                    <StatValueSpinner />
                ) : (
                    <p className="text-3xl font-bold text-slate-900 mt-1">{activeSites}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">Approved consents</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Clock className="size-5 text-blue-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Pending Requests</p>
                {bookingMetricsLoading ? (
                    <StatValueSpinner />
                ) : (
                    <p className="text-3xl font-bold text-slate-900 mt-1">{pendingRequestsCount}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">Awaiting review</p>
            </div>

            <div className="bg-[#EAF2FF] rounded-xl p-6 shadow-sm border border-[#D6E4FF] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3">
                    <TrendingUp className="size-5 text-blue-600 opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="size-10 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <PoundSterling className="size-5 text-blue-600" />
                </div>
                <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
                {revenueLoading ? (
                    <StatValueSpinner />
                ) : (
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                        £{totalRevenue.toFixed(2)}
                    </p>
                )}
                <p
                    className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                        isRevenueUp ? 'text-blue-600' : 'text-red-600'
                    }`}
                >
                    {isRevenueUp ? (
                        <ArrowUpRight className="size-3" />
                    ) : (
                        <ArrowDownRight className="size-3" />
                    )}
                    {`${isRevenueUp ? '+' : ''}${revenueTrendPercent.toFixed(1)}% vs previous 30 days`}
                </p>
            </div>
        </div>
    );
}
