import { motion } from 'motion/react';
import { Award, Calendar, DollarSign, MapPin, TrendingUp } from 'lucide-react';
import { MetricCard } from './MetricCard';

import { Loader2 } from 'lucide-react';

interface AnalyticsSectionProps {
    data: any;
    isLoading: boolean;
}

export function AnalyticsSection({ data, isLoading }: AnalyticsSectionProps) {
    const bookingPeriods = ['7 days: ' + (data?.toalActivity?.bookingsLast7Days || 0), '30 days: ' + (data?.toalActivity?.bookingsLast30Days || 0), '90 days: ' + (data?.toalActivity?.bookingsLast90Days || 0)];

    if (isLoading || !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading analytics...</p>
            </div>
        );
    }

    return (
        <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
        >
            <div className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                    <div className="size-10 bg-[#EAF2FF] rounded-xl flex items-center justify-center text-blue-600">
                        <Calendar className="size-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        TOAL Activity Metrics
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <MetricCard
                        label="Total TOAL Bookings"
                        value={data.toalActivity.totalBookings.toLocaleString()}
                    />
                    <MetricCard
                        label="Approved TOALs"
                        value={data.toalActivity.approvedToals.toLocaleString()}
                        color="emerald"
                    />
                    <MetricCard
                        label="Rejected TOALs"
                        value={data.toalActivity.rejectedToals.toLocaleString()}
                        color="red"
                    />
                    <MetricCard
                        label="Cancelled / Blocked"
                        value={data.toalActivity.cancelledBlockedToals.toLocaleString()}
                        color="amber"
                    />
                </div>

                <div className="flex items-center gap-4 mb-12 bg-slate-50 p-4 rounded-2xl w-fit">
                    <span className="text-sm font-black text-slate-500 uppercase tracking-wider">
                        Bookings in last:
                    </span>
                    <div className="flex gap-2">
                        {bookingPeriods.map((period, index) => (
                            <button
                                key={period}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    index === 1
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-white'
                                }`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <h3 className="text-lg font-black text-slate-800">
                            Top Operators by TOAL Volume
                        </h3>
                        <div className="space-y-3">
                            {data.toalActivity.topOperators.length > 0 ? (
                                data.toalActivity.topOperators.map((operator: any, index: number) => (
                                    <div
                                        key={operator.name}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-400">
                                                #{index + 1}
                                            </span>
                                            <span className="text-sm font-bold text-slate-600">
                                                {operator.name}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-slate-800">
                                            {operator.bookings} bookings
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic p-4">No operator data available</p>
                            )}
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                            <p className="text-sm font-bold text-blue-600">
                                Average TOALs per operator:{' '}
                                {data.toalActivity.avgToalsPerOperator}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-black text-slate-800">
                            Top Sites by TOAL Usage
                        </h3>
                        <div className="space-y-3">
                            {data.toalActivity.topSites.length > 0 ? (
                                data.toalActivity.topSites.map((site: any, index: number) => (
                                    <div
                                        key={site.name}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-400">
                                                #{index + 1}
                                            </span>
                                            <span className="text-sm font-bold text-slate-600">
                                                {site.name}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-slate-800">
                                            {site.usage} uses
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic p-4">No site data available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                    <div className="size-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <MapPin className="size-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        Emergency & Recovery Site Metrics (Planning vs Actual Use)
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
                    <MetricCard
                        label="Emergency & Recovery Selections (Planned)"
                        value={data.clzMetrics.clzSelections.toLocaleString()}
                    />
                    <MetricCard
                        label="Unique Sites Selected"
                        value={data.clzMetrics.uniqueSitesSelected.toLocaleString()}
                    />
                    <MetricCard
                        label="Emergency Landings (Used)"
                        value={data.clzMetrics.clzEmergencyLandings.toLocaleString()}
                        color="red"
                    />
                    <MetricCard
                        label="Selected but Not Used"
                        value={data.clzMetrics.clzSelectedNotUsed.toLocaleString()}
                        color="emerald"
                    />
                    <MetricCard
                        label="Usage Rate"
                        value={`${data.clzMetrics.clzUsageRate}%`}
                    />
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-800">
                        Sites Most Frequently Selected as Emergency & Recovery
                    </h3>
                    <div className="space-y-3">
                        {data.clzMetrics.mostFrequentClzSites.length > 0 ? (
                            data.clzMetrics.mostFrequentClzSites.map((site: any, index: number) => (
                                <div
                                    key={site.name}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-400">
                                            #{index + 1}
                                        </span>
                                        <span className="text-sm font-bold text-slate-600">
                                            {site.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-black text-slate-800">
                                        {site.selections} selections
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 italic p-4">No site data available</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                    <div className="size-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <DollarSign className="size-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        Revenue & Payments
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <MetricCard
                        label="Total Revenue"
                        value={`£${data.revenue.totalRevenue.toLocaleString()}`}
                        color="emerald"
                    />
                    <MetricCard
                        label="Revenue from TOAL"
                        value={`£${data.revenue.revenueFromToal.toLocaleString()}`}
                    />
                    <MetricCard
                        label="Revenue from Emergency & Recovery use"
                        value={`£${data.revenue.revenueFromEmergencyUse.toLocaleString()}`}
                    />
                    <MetricCard
                        label="Platform Fees Collected"
                        value={`£${data.revenue.platformFeesCollected.toLocaleString()}`}
                        color="blue"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        label="Landowner Payouts"
                        value={`£${data.revenue.landownerPayouts.toLocaleString()}`}
                    />
                    <MetricCard
                        label="Refunds Issued"
                        value={`£${data.revenue.refundsIssued.toLocaleString()}`}
                        color="red"
                    />
                    <MetricCard
                        label="Net Platform Revenue"
                        value={`£${data.revenue.netPlatformRevenue.toLocaleString()}`}
                        color="blue"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                    <div className="size-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Award className="size-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        Certificate & Compliance Metrics
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <MetricCard
                        label="Certificates Issued"
                        value={data.certificates.certificatesIssued.toLocaleString()}
                    />
                    <MetricCard
                        label="Certificates Withdrawn"
                        value={data.certificates.certificatesWithdrawn.toLocaleString()}
                        color="red"
                    />
                    <MetricCard
                        label="Certificates Verified"
                        value={data.certificates.certificatesVerified.toLocaleString()}
                        color="emerald"
                    />
                    <MetricCard
                        label="Avg per Operator"
                        value={data.certificates.avgPerOperator.toString()}
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                    <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <TrendingUp className="size-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        User Growth & Behaviour
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <MetricCard
                        label="New Users This Week"
                        value={data.userGrowth.newUsersThisWeek.toString()}
                    />
                    <MetricCard
                        label="New Users This Month"
                        value={data.userGrowth.newUsersThisMonth.toString()}
                    />
                    <MetricCard
                        label="Operators with Repeat Bookings"
                        value={data.userGrowth.operatorsWithRepeatBookings.toString()}
                        color="emerald"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        label="Landowner Growth Rate"
                        value={`${data.userGrowth.landownersGrowthRate > 0 ? '+' : ''}${data.userGrowth.landownersGrowthRate}%`}
                        color="emerald"
                    />
                    <MetricCard
                        label="Operator Growth Rate"
                        value={`${data.userGrowth.operatorsGrowthRate > 0 ? '+' : ''}${data.userGrowth.operatorsGrowthRate}%`}
                        color="blue"
                    />
                    <MetricCard
                        label="Landowners with Multiple Sites"
                        value={data.userGrowth.landownersWithMultipleSites.toString()}
                    />
                </div>
            </div>
        </motion.div>
    );
}
