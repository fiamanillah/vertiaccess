import { motion } from 'motion/react';
import { Award, Calendar, DollarSign, MapPin, TrendingUp } from 'lucide-react';
import { MetricCard } from './MetricCard';

const mockAnalyticsData = {
    toalActivity: {
        totalBookings: 3452,
        bookingsLast7Days: 89,
        bookingsLast30Days: 367,
        bookingsLast90Days: 1024,
        approvedToals: 2987,
        rejectedToals: 234,
        cancelledBlockedToals: 231,
        avgToalsPerOperator: 4.8,
        topOperators: [
            { name: 'SkyOps Ltd', bookings: 234 },
            { name: 'DroneLogistics UK', bookings: 198 },
            { name: 'AeroSurvey Pro', bookings: 176 },
            { name: 'Highland Drones', bookings: 143 },
            { name: 'Coastal Air Services', bookings: 128 },
        ],
        topSites: [
            { name: 'Central Distribution Hub', usage: 456 },
            { name: 'North Field Landing Zone', usage: 389 },
            { name: 'Industrial Park TOAL', usage: 301 },
            { name: 'Riverside Recovery Site', usage: 267 },
            { name: 'Highland Base Station', usage: 234 },
        ],
    },
    clzMetrics: {
        clzSelections: 1834,
        uniqueSitesSelected: 178,
        clzEmergencyLandings: 47,
        clzSelectedNotUsed: 1787,
        clzUsageRate: 2.6,
        mostFrequentClzSites: [
            { name: 'Emergency Field Alpha', selections: 234 },
            { name: 'South Meadow Recovery', selections: 189 },
            { name: 'Coastal Emergency Zone', selections: 167 },
            { name: 'Highland Emergency Site', selections: 145 },
            { name: 'Industrial Backup TOAL', selections: 132 },
        ],
    },
    revenue: {
        totalRevenue: 207360.0,
        revenueFromToal: 172600.0,
        revenueFromEmergencyUse: 4700.0,
        platformFeesCollected: 34760.0,
        landownerPayouts: 177300.0,
        refundsIssued: 13860.0,
        netPlatformRevenue: 20900.0,
    },
    certificates: {
        certificatesIssued: 2987,
        certificatesWithdrawn: 231,
        certificatesVerified: 1456,
        avgPerOperator: 4.1,
    },
    userGrowth: {
        newUsersThisWeek: 23,
        newUsersThisMonth: 87,
        operatorsWithRepeatBookings: 542,
        landownersGrowthRate: 12.3,
        operatorsGrowthRate: 18.7,
        landownersWithMultipleSites: 124,
    },
};

export function AnalyticsSection() {
    const bookingPeriods = ['7 days: 89', '30 days: 367', '90 days: 1024'];

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
                        value={mockAnalyticsData.toalActivity.totalBookings.toLocaleString()}
                    />
                    <MetricCard
                        label="Approved TOALs"
                        value={mockAnalyticsData.toalActivity.approvedToals.toLocaleString()}
                        color="emerald"
                    />
                    <MetricCard
                        label="Rejected TOALs"
                        value={mockAnalyticsData.toalActivity.rejectedToals.toLocaleString()}
                        color="red"
                    />
                    <MetricCard
                        label="Cancelled / Blocked"
                        value={mockAnalyticsData.toalActivity.cancelledBlockedToals.toLocaleString()}
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
                            {mockAnalyticsData.toalActivity.topOperators.map((operator, index) => (
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
                            ))}
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                            <p className="text-sm font-bold text-blue-600">
                                Average TOALs per operator:{' '}
                                {mockAnalyticsData.toalActivity.avgToalsPerOperator}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-black text-slate-800">
                            Top Sites by TOAL Usage
                        </h3>
                        <div className="space-y-3">
                            {mockAnalyticsData.toalActivity.topSites.map((site, index) => (
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
                            ))}
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
                        value={mockAnalyticsData.clzMetrics.clzSelections.toLocaleString()}
                    />
                    <MetricCard
                        label="Unique Sites Selected"
                        value={mockAnalyticsData.clzMetrics.uniqueSitesSelected.toLocaleString()}
                    />
                    <MetricCard
                        label="Emergency Landings (Used)"
                        value={mockAnalyticsData.clzMetrics.clzEmergencyLandings.toLocaleString()}
                        color="red"
                    />
                    <MetricCard
                        label="Selected but Not Used"
                        value={mockAnalyticsData.clzMetrics.clzSelectedNotUsed.toLocaleString()}
                        color="emerald"
                    />
                    <MetricCard
                        label="Usage Rate"
                        value={`${mockAnalyticsData.clzMetrics.clzUsageRate}%`}
                    />
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-800">
                        Sites Most Frequently Selected as Emergency & Recovery
                    </h3>
                    <div className="space-y-3">
                        {mockAnalyticsData.clzMetrics.mostFrequentClzSites.map((site, index) => (
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
                        ))}
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
                        value={`£${mockAnalyticsData.revenue.totalRevenue.toLocaleString()}`}
                        color="emerald"
                    />
                    <MetricCard
                        label="Revenue from TOAL"
                        value={`£${mockAnalyticsData.revenue.revenueFromToal.toLocaleString()}`}
                    />
                    <MetricCard
                        label="Revenue from Emergency & Recovery use"
                        value={`£${mockAnalyticsData.revenue.revenueFromEmergencyUse.toLocaleString()}`}
                    />
                    <MetricCard
                        label="Platform Fees Collected"
                        value={`£${mockAnalyticsData.revenue.platformFeesCollected.toLocaleString()}`}
                        color="blue"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        label="Landowner Payouts"
                        value={`£${mockAnalyticsData.revenue.landownerPayouts.toLocaleString()}`}
                    />
                    <MetricCard
                        label="Refunds Issued"
                        value={`£${mockAnalyticsData.revenue.refundsIssued.toLocaleString()}`}
                        color="red"
                    />
                    <MetricCard
                        label="Net Platform Revenue"
                        value={`£${mockAnalyticsData.revenue.netPlatformRevenue.toLocaleString()}`}
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
                        value={mockAnalyticsData.certificates.certificatesIssued.toLocaleString()}
                    />
                    <MetricCard
                        label="Certificates Withdrawn"
                        value={mockAnalyticsData.certificates.certificatesWithdrawn.toLocaleString()}
                        color="red"
                    />
                    <MetricCard
                        label="Certificates Verified"
                        value={mockAnalyticsData.certificates.certificatesVerified.toLocaleString()}
                        color="emerald"
                    />
                    <MetricCard
                        label="Avg per Operator"
                        value={mockAnalyticsData.certificates.avgPerOperator.toString()}
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
                        value={mockAnalyticsData.userGrowth.newUsersThisWeek.toString()}
                    />
                    <MetricCard
                        label="New Users This Month"
                        value={mockAnalyticsData.userGrowth.newUsersThisMonth.toString()}
                    />
                    <MetricCard
                        label="Operators with Repeat Bookings"
                        value={mockAnalyticsData.userGrowth.operatorsWithRepeatBookings.toString()}
                        color="emerald"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        label="Landowner Growth Rate"
                        value={`+${mockAnalyticsData.userGrowth.landownersGrowthRate}%`}
                        color="emerald"
                    />
                    <MetricCard
                        label="Operator Growth Rate"
                        value={`+${mockAnalyticsData.userGrowth.operatorsGrowthRate}%`}
                        color="blue"
                    />
                    <MetricCard
                        label="Landowners with Multiple Sites"
                        value={mockAnalyticsData.userGrowth.landownersWithMultipleSites.toString()}
                    />
                </div>
            </div>
        </motion.div>
    );
}
