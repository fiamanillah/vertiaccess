import { motion } from 'motion/react';
import { Skeleton } from '../ui/skeleton';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value?: string;
    color: string;
}

export function StatCard({ icon, label, value, color }: StatCardProps) {
    const colors: Record<string, string> = {
        blue: 'text-blue-600 bg-[#EAF2FF]',
        green: 'text-[#15803D] bg-[#DCFCE7]',
        indigo: 'text-indigo-600 bg-indigo-50',
        amber: 'text-amber-600 bg-amber-50',
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transition-all"
        >
            <div className="flex items-center gap-3 mb-4">
                <div
                    className={`size-10 rounded-xl flex items-center justify-center ${colors[color]}`}
                >
                    {icon}
                </div>
                <p className="text-sm font-bold text-slate-500">{label}</p>
            </div>
            {value === undefined ? (
                <Skeleton className="h-10 w-24 rounded-2xl" />
            ) : (
                <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
            )}
        </motion.div>
    );
}
