import { motion } from 'motion/react';
import {
    Plane,
    Clock,
    Shield,
    FileText,
    PoundSterling,
    ArrowUpRight,
    TrendingUp,
    Search,
} from 'lucide-react';
import { Spinner } from '../ui/spinner';

interface MetricsCardsProps {
    activeBookings: number;
    pendingBookings: number;
    clzCount: number;
    certificatesCount: number;
    totalSpend: number;
    userName: string;
    isVerified: boolean;
    bookingsLoading?: boolean;
    certificatesLoading?: boolean;
    onOpenBookingFlow: () => void;
}

export function MetricsCards({
    activeBookings,
    pendingBookings,
    clzCount,
    certificatesCount,
    totalSpend,
    userName,
    isVerified,
    bookingsLoading = false,
    certificatesLoading = false,
    onOpenBookingFlow,
}: MetricsCardsProps) {
    function StatValueSpinner() {
        return (
            <div className="h-11 flex items-center justify-end">
                <Spinner size="sm" className="text-slate-400" aria-label="Loading metric" />
            </div>
        );
    }
    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Welcome, {userName}
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Manage your flight operations and infrastructure access.
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenBookingFlow}
                    disabled={bookingsLoading}
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2 font-bold disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                >
                    <Search className="size-5" />
                    Book Site Access
                </motion.button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <Plane className="size-5 text-blue-600" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Active Ops</p>
                    {bookingsLoading ? (
                        <StatValueSpinner />
                    ) : (
                        <p className="text-3xl font-bold text-slate-900 mt-1">{activeBookings}</p>
                    )}
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <Clock className="size-5 text-blue-600" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Pending</p>
                    {bookingsLoading ? (
                        <StatValueSpinner />
                    ) : (
                        <p className="text-3xl font-bold text-slate-900 mt-1">{pendingBookings}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">Awaiting approval</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <Shield className="size-5 text-blue-600" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Emergency & Recovery</p>
                    {bookingsLoading ? (
                        <StatValueSpinner />
                    ) : (
                        <p className="text-3xl font-bold text-slate-900 mt-1">{clzCount}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">Recovery zones</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="size-5 text-blue-600" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Certificates</p>
                    {certificatesLoading ? (
                        <StatValueSpinner />
                    ) : (
                        <p className="text-3xl font-bold text-slate-900 mt-1">
                            {certificatesCount}
                        </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">Valid consents</p>
                </div>

                <div className="bg-[#EAF2FF] rounded-xl p-6 shadow-sm border border-[#D6E4FF] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3">
                        <TrendingUp className="size-5 text-blue-600 opacity-30 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="size-10 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <PoundSterling className="size-5 text-blue-600" />
                    </div>
                    <p className="text-slate-600 text-sm font-medium">Total Spend</p>
                    {bookingsLoading ? (
                        <StatValueSpinner />
                    ) : (
                        <p className="text-3xl font-bold text-slate-900 mt-1">
                            £{totalSpend.toFixed(2)}
                        </p>
                    )}
                    <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1">
                        <ArrowUpRight className="size-3" />
                        +5.2% this month
                    </p>
                </div>
            </div>
        </>
    );
}
