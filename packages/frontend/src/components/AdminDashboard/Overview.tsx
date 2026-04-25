import { motion } from 'motion/react';
import {
    Users,
    UserCheck,
    TrendingUp,
    CheckCircle,
    MapPin,
    Clock,
    FileText,
    Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { StatCard } from './StatCard';
import { apiGetAdminStats } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';

interface OverviewProps {
    pendingVerifications: any[];
    verificationCounts?: {
        pending: number;
        landowners: number;
        operators: number;
        sites: number;
    };
    onViewChange: (
        view:
            | 'overview'
            | 'landowners'
            | 'operators'
            | 'sites'
            | 'user-mgmt'
            | 'incidents'
            | 'analytics'
    ) => void;
    isLoading?: boolean;
}

export function Overview({
    pendingVerifications,
    verificationCounts,
    onViewChange,
    isLoading = false,
}: OverviewProps) {
    const { idToken } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (!idToken) {
            setStatsLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const data = await apiGetAdminStats(idToken);
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, [idToken]);

    const pendingCount =
        verificationCounts?.pending ??
        pendingVerifications.filter(v => v.status === 'PENDING').length;
    const landownerCount =
        verificationCounts?.landowners ??
        pendingVerifications.filter(
            v =>
                (v.type === 'landowner' || (v.type === 'identity' && v.userRole !== 'operator')) &&
                v.status === 'PENDING'
        ).length;
    const operatorCount =
        verificationCounts?.operators ??
        pendingVerifications.filter(
            v =>
                (v.type === 'operator' || (v.type === 'identity' && v.userRole === 'operator')) &&
                v.status === 'PENDING'
        ).length;
    const siteCount =
        verificationCounts?.sites ??
        pendingVerifications.filter(v => v.type === 'site' && v.status === 'PENDING').length;

    const isLoadingStats = statsLoading || isLoading;

    return (
        <div className="space-y-6 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Users className="size-5" />}
                    label="Total Users"
                    value={isLoadingStats ? undefined : (stats?.totalUsers || 0).toLocaleString()}
                    color="blue"
                />
                <StatCard
                    icon={<UserCheck className="size-5" />}
                    label="Landowners"
                    value={
                        isLoadingStats ? undefined : (stats?.totalLandowners || 0).toLocaleString()
                    }
                    color="green"
                />
                <StatCard
                    icon={<Users className="size-5" />}
                    label="Operators"
                    value={
                        isLoadingStats ? undefined : (stats?.totalOperators || 0).toLocaleString()
                    }
                    color="blue"
                />
                <StatCard
                    icon={<TrendingUp className="size-5" />}
                    label="Active Users (30d)"
                    value={
                        isLoadingStats
                            ? undefined
                            : (stats?.activeUsersLast30Days || 0).toLocaleString()
                    }
                    color="indigo"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<CheckCircle className="size-5" />}
                    label="Verified Landowners"
                    value={
                        isLoadingStats
                            ? undefined
                            : (stats?.verifiedLandowners || 0).toLocaleString()
                    }
                    color="green"
                />
                <StatCard
                    icon={<MapPin className="size-5" />}
                    label="Active Sites (TOAL-enabled)"
                    value={
                        isLoadingStats ? undefined : (stats?.activeSitesToal || 0).toLocaleString()
                    }
                    color="blue"
                />
                <StatCard
                    icon={<MapPin className="size-5" />}
                    label="Emergency & Recovery enabled Sites"
                    value={
                        isLoadingStats
                            ? undefined
                            : (stats?.emergencyRecoveryEnabledSites || 0).toLocaleString()
                    }
                    color="amber"
                />

                <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => onViewChange('overview')}
                    className={`bg-white rounded-3xl p-8 shadow-sm border border-slate-100 cursor-pointer group ${
                        isLoadingStats ? 'animate-pulse' : ''
                    }`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                            <Clock className="size-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">Pending Verifications</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoadingStats ? (
                            <>
                                <div className="h-10 flex items-center">
                                    <Loader2 className="size-7 animate-spin text-slate-400" />
                                </div>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-black uppercase rounded tracking-wider inline-flex items-center gap-1.5">
                                    <Loader2 className="size-3 animate-spin" />
                                    Loading
                                </span>
                            </>
                        ) : (
                            <>
                                <p className="text-3xl font-black text-slate-800">{pendingCount}</p>
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded tracking-wider">
                                    Requires Action
                                </span>
                            </>
                        )}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <UserCheck className="size-3.5" />{' '}
                            {isLoadingStats ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                landownerCount
                            )}{' '}
                            Landowners
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Users className="size-3.5" />{' '}
                            {isLoadingStats ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                operatorCount
                            )}{' '}
                            Operators
                        </span>
                        <span className="flex items-center gap-1.5">
                            <FileText className="size-3.5" />{' '}
                            {isLoadingStats ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                siteCount
                            )}{' '}
                            Sites
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
