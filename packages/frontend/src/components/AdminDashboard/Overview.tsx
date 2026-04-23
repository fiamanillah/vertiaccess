import { motion } from 'motion/react';
import { Users, UserCheck, TrendingUp, CheckCircle, MapPin, Clock, FileText } from 'lucide-react';
import { StatCard } from './StatCard';
import { Skeleton } from '../ui/skeleton';

interface OverviewProps {
    pendingVerifications: any[];
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

export function Overview({ pendingVerifications, onViewChange, isLoading = false }: OverviewProps) {
    const pendingCount = pendingVerifications.filter(v => v.status === 'PENDING').length;
    const landownerCount = pendingVerifications.filter(
        v =>
            (v.type === 'landowner' || (v.type === 'identity' && v.userRole !== 'operator')) &&
            v.status === 'PENDING'
    ).length;
    const operatorCount = pendingVerifications.filter(
        v =>
            (v.type === 'operator' || (v.type === 'identity' && v.userRole === 'operator')) &&
            v.status === 'PENDING'
    ).length;
    const siteCount = pendingVerifications.filter(
        v => v.type === 'site' && v.status === 'PENDING'
    ).length;

    return (
        <div className="space-y-6 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Users className="size-5" />}
                    label="Total Users"
                    value="1,247"
                    color="blue"
                />
                <StatCard
                    icon={<UserCheck className="size-5" />}
                    label="Landowners"
                    value="523"
                    color="green"
                />
                <StatCard
                    icon={<Users className="size-5" />}
                    label="Operators"
                    value="724"
                    color="blue"
                />
                <StatCard
                    icon={<TrendingUp className="size-5" />}
                    label="Active Users (30d)"
                    value="892"
                    color="indigo"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<CheckCircle className="size-5" />}
                    label="Verified Landowners"
                    value="487"
                    color="green"
                />
                <StatCard
                    icon={<MapPin className="size-5" />}
                    label="Active Sites (TOAL-enabled)"
                    value="342"
                    color="blue"
                />
                <StatCard
                    icon={<MapPin className="size-5" />}
                    label="Emergency & Recovery enabled Sites"
                    value="286"
                    color="amber"
                />

                <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => onViewChange('overview')}
                    className={`bg-white rounded-3xl p-8 shadow-sm border border-slate-100 cursor-pointer group ${
                        isLoading ? 'animate-pulse' : ''
                    }`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                            <Clock className="size-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">Pending Verifications</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoading ? (
                            <>
                                <Skeleton className="h-10 w-20 rounded-2xl" />
                                <Skeleton className="h-5 w-28 rounded-full" />
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
                            {isLoading ? (
                                <Skeleton className="h-3.5 w-8 rounded-full" />
                            ) : (
                                landownerCount
                            )}{' '}
                            Landowners
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Users className="size-3.5" />{' '}
                            {isLoading ? (
                                <Skeleton className="h-3.5 w-8 rounded-full" />
                            ) : (
                                operatorCount
                            )}{' '}
                            Operators
                        </span>
                        <span className="flex items-center gap-1.5">
                            <FileText className="size-3.5" />{' '}
                            {isLoading ? (
                                <Skeleton className="h-3.5 w-8 rounded-full" />
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
