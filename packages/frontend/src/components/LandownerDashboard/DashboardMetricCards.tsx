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
        <div className="h-11 flex items-center justify-end">
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
    const baseCardClass =
        'rounded-2xl p-6 shadow-sm border min-h-[190px] flex flex-col justify-between transition-all duration-200';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className={`${baseCardClass} bg-white border-slate-200 hover:shadow-md`}>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Total Sites</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="size-11 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Globe className="size-5 text-blue-600" />
                        </div>
                        {sitesLoading ? (
                            <StatValueSpinner />
                        ) : (
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">
                                {totalSites}
                            </p>
                        )}
                    </div>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-4">&nbsp;</p>
            </div>

            <div className={`${baseCardClass} bg-white border-slate-200 hover:shadow-md`}>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Active Sites</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="size-11 bg-blue-50 rounded-xl flex items-center justify-center">
                            <CheckCircle className="size-5 text-blue-600" />
                        </div>
                        {sitesLoading ? (
                            <StatValueSpinner />
                        ) : (
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">
                                {activeSites}
                            </p>
                        )}
                    </div>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-4">&nbsp;</p>
            </div>

            <div className={`${baseCardClass} bg-white border-slate-200 hover:shadow-md`}>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Pending Requests</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="size-11 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Clock className="size-5 text-blue-600" />
                        </div>
                        {bookingMetricsLoading ? (
                            <StatValueSpinner />
                        ) : (
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">
                                {pendingRequestsCount}
                            </p>
                        )}
                    </div>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-4">&nbsp;</p>
            </div>

            <div
                className={`${baseCardClass} bg-[#EAF2FF] border-[#D6E4FF] relative overflow-hidden group hover:shadow-md`}
            >
                <div className="absolute top-0 right-0 p-3">
                    <TrendingUp className="size-5 text-blue-600 opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                    <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="size-11 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <PoundSterling className="size-5 text-blue-600" />
                        </div>
                        {revenueLoading ? (
                            <StatValueSpinner />
                        ) : (
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">
                                £{totalRevenue.toFixed(2)}
                            </p>
                        )}
                    </div>
                </div>
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
