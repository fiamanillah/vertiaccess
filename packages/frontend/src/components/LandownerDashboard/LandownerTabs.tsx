import { motion } from 'motion/react';
import { Spinner } from '../ui/spinner';

export type LandownerView = 'sites' | 'requests' | 'incidents' | 'balance';

interface LandownerTabsProps {
    view: LandownerView;
    onViewChange: (view: LandownerView) => void;
    pendingRequestsCount: number;
    pendingRequestsLoading: boolean;
    openIncidentsCount: number;
    incidentsLoading: boolean;
}

function CountBadge({
    count,
    loading,
    danger = false,
}: {
    count: number;
    loading: boolean;
    danger?: boolean;
}) {
    if (loading) {
        return (
            <span className="inline-flex items-center justify-center size-4">
                <Spinner
                    size="sm"
                    className={danger ? 'text-red-500' : 'text-blue-500'}
                    aria-label="Loading count"
                />
            </span>
        );
    }

    if (count <= 0) return null;

    return (
        <span
            className={`text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm ${
                danger ? 'bg-red-600' : 'bg-blue-600'
            }`}
        >
            {count}
        </span>
    );
}

export function LandownerTabs({
    view,
    onViewChange,
    pendingRequestsCount,
    pendingRequestsLoading,
    openIncidentsCount,
    incidentsLoading,
}: LandownerTabsProps) {
    return (
        <div className="flex gap-8 mb-8 border-b border-slate-200 overflow-x-auto">
            <button
                onClick={() => onViewChange('sites')}
                className={`pb-4 text-sm font-bold transition-all relative ${
                    view === 'sites' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
                My Sites
                {view === 'sites' && (
                    <motion.div
                        layoutId="landownerActiveTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    />
                )}
            </button>

            <button
                onClick={() => onViewChange('requests')}
                className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
                    view === 'requests' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
                Booking Requests
                <CountBadge count={pendingRequestsCount} loading={pendingRequestsLoading} />
                {view === 'requests' && (
                    <motion.div
                        layoutId="landownerActiveTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    />
                )}
            </button>

            <button
                onClick={() => onViewChange('incidents')}
                className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
                    view === 'incidents' ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
                Incident Reports
                <CountBadge count={openIncidentsCount} loading={incidentsLoading} danger />
                {view === 'incidents' && (
                    <motion.div
                        layoutId="landownerActiveTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                    />
                )}
            </button>

            <button
                onClick={() => onViewChange('balance')}
                className={`pb-4 text-sm font-bold transition-all relative ${
                    view === 'balance' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
                Balance
                {view === 'balance' && (
                    <motion.div
                        layoutId="landownerActiveTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                    />
                )}
            </button>
        </div>
    );
}
