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
import { Skeleton } from '../ui/skeleton';

interface MetricsCardsProps {
    activeBookings: number;
    pendingBookings: number;
    clzCount: number;
    certificatesCount: number;
    totalSpend: number;
    userName: string;
    isVerified: boolean;
    isLoading?: boolean;
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
    isLoading = false,
    onOpenBookingFlow,
}: MetricsCardsProps) {
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
                    disabled={!isVerified || isLoading}
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2 font-bold disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                >
                    <Search className="size-5" />
                    Book Site Access
                </motion.button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                {isLoading && (
                    <div className="col-span-full flex items-center gap-2 px-6 py-4 bg-linear-to-r from-blue-50/50 to-blue-50/30 rounded-xl border border-blue-100">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                        <div
                            className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                        />
                        <div
                            className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                            style={{ animationDelay: '0.4s' }}
                        />
                        <p className="text-sm font-medium text-slate-600 ml-2">
                            Loading your metrics...
                        </p>
                    </div>
                )}
                {isLoading ? (
                    <>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                            >
                                <Skeleton className="size-10 rounded-full mb-4" />
                                <Skeleton className="h-4 w-24 mb-3" />
                                <Skeleton className="h-10 w-16 mb-2" />
                                <Skeleton className="h-3 w-28 opacity-50" />
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <Plane className="size-5 text-blue-600" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium">Active Ops</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">
                                {activeBookings}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Approved windows</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <Clock className="size-5 text-blue-600" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium">Pending</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">
                                {pendingBookings}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Awaiting approval</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <Shield className="size-5 text-blue-600" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium">
                                Emergency & Recovery
                            </p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{clzCount}</p>
                            <p className="text-xs text-slate-400 mt-1">Recovery zones</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <FileText className="size-5 text-blue-600" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium">Certificates</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">
                                {certificatesCount}
                            </p>
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
                            <p className="text-3xl font-bold text-slate-900 mt-1">
                                £{totalSpend.toFixed(2)}
                            </p>
                            <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1">
                                <ArrowUpRight className="size-3" />
                                +5.2% this month
                            </p>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
