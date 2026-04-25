import { User as UserIcon, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface ProfileModalShellProps {
    title: string;
    subtitle: string;
    onClose: () => void;
    children: ReactNode;
}

export function ProfileModalShell({ title, subtitle, onClose, children }: ProfileModalShellProps) {
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl  flex items-center justify-center p-4 z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-[2rem] max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-slate-900/10 flex flex-col isolation-isolate"
            >
                <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-white/95 backdrop-blur sticky top-0 z-20 rounded-t-[2rem]">
                    <div className="flex items-center gap-4">
                        <div className="size-11 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200">
                            <UserIcon className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                            <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-9 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">{children}</div>
            </motion.div>
        </div>
    );
}
