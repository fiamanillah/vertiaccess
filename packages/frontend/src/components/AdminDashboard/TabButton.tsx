import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    badge?: number;
    isLoading?: boolean;
}

export function TabButton({ active, onClick, icon, label, badge, isLoading }: TabButtonProps) {
    const shouldShowBadge = isLoading || badge !== undefined;

    return (
        <button
            onClick={onClick}
            className={`relative h-14 flex items-center gap-2 px-1 transition-all group ${
                active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
        >
            <div
                className={`size-8 rounded-lg flex items-center justify-center transition-colors ${
                    active ? 'bg-[#EAF2FF]' : 'bg-transparent group-hover:bg-slate-100'
                }`}
            >
                {icon}
            </div>
            <span
                className={`text-base font-black transition-all whitespace-nowrap ${
                    active ? 'tracking-tight' : ''
                }`}
            >
                {label}
            </span>
            {shouldShowBadge && (
                <span
                    className={`ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black transition-all ${
                        isLoading ? 'bg-slate-100 text-slate-400' : 'bg-amber-500 text-white'
                    }`}
                >
                    {isLoading ? <Loader2 className="size-3 animate-spin" /> : badge}
                </span>
            )}
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                />
            )}
        </button>
    );
}
