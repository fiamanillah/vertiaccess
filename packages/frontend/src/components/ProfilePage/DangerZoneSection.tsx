interface DangerZoneSectionProps {
    onDeactivateAccount: () => void;
}

export function DangerZoneSection({ onDeactivateAccount }: DangerZoneSectionProps) {
    return (
        <div className="rounded-2xl  bg-red-50/40 p-4 md:p-5 flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-bold text-red-900">Deactivate Account</p>
                <p className="text-xs text-red-700/80 mt-1">
                    Your account remains active until the next billing period, then access is
                    disabled.
                </p>
            </div>
            <button
                onClick={onDeactivateAccount}
                className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all hover:border-red-300 whitespace-nowrap"
            >
                Deactivate Account
            </button>
        </div>
    );
}
