import { motion } from 'motion/react';

export type ViewType = 'bookings' | 'clz' | 'certificates' | 'incidents';

interface NavigationTabsProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
}

export function NavigationTabs({ currentView, onViewChange }: NavigationTabsProps) {
    const tabs = [
        { id: 'bookings' as const, label: 'My Bookings' },
        { id: 'clz' as const, label: 'Emergency & Recovery' },
        { id: 'certificates' as const, label: 'Consent Certificates' },
        { id: 'incidents' as const, label: 'Incident Reports' },
    ];

    return (
        <div className="flex gap-8 mb-8 border-b border-slate-200 overflow-x-auto">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onViewChange(tab.id)}
                    className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 whitespace-nowrap ${
                        currentView === tab.id
                            ? tab.id === 'incidents'
                                ? 'text-red-600'
                                : 'text-blue-600'
                            : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    {tab.label}
                    {currentView === tab.id && (
                        <motion.div
                            layoutId="opTab"
                            className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                                tab.id === 'incidents' ? 'bg-red-600' : 'bg-blue-600'
                            }`}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
