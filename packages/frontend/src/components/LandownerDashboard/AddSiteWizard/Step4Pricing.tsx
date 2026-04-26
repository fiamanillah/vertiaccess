import { PoundSterling, ShieldCheck, Check } from 'lucide-react';

interface Step4PricingProps {
    accessFee: string;
    setAccessFee: (value: string) => void;
    clzAccessFee: string;
    setClzAccessFee: (value: string) => void;
    siteType: 'toal' | 'emergency';
    emergencyRecoveryEnabled: boolean;
    siteCategory: string;
    platformFee: number | null;
    platformFeeLoading: boolean;
}

export function Step4Pricing({
    accessFee,
    setAccessFee,
    clzAccessFee,
    setClzAccessFee,
    siteType,
    emergencyRecoveryEnabled,
    siteCategory,
    platformFee,
    platformFeeLoading,
}: Step4PricingProps) {
    const parsedAccessFee = Number(accessFee || 0);
    const parsedClzAccessFee = Number(clzAccessFee || 0);
    const operatorPays =
        typeof platformFee === 'number' ? parsedAccessFee + platformFee : parsedAccessFee;

    return (
        <div className="space-y-10">
            <div className="flex items-center gap-3">
                <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <PoundSterling className="size-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Commercial Setup</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* Pricing Guidance */}
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                        <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <ShieldCheck className="size-4" />
                            Typical Pricing
                        </p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-bold text-blue-700">£50 – £150</span>
                            <span className="text-sm text-blue-600">per booking</span>
                        </div>
                        <p className="text-xs text-blue-800/70 leading-relaxed">
                            Market-competitive rates for{' '}
                            {siteCategory === 'private_land' ? 'Private Land' : 'Private Rooftop'}{' '}
                            sites. You retain full control over pricing.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">
                                {siteType === 'toal' ? 'TOAL Access Fee' : 'Emergency Access Fee'} *
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                    £
                                </span>
                                <input
                                    type="number"
                                    value={accessFee}
                                    onChange={e => setAccessFee(e.target.value)}
                                    className="w-full pl-10 pr-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-2xl font-bold text-slate-900"
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Amount paid by the operator per approved operation.
                            </p>
                        </div>

                        {siteType === 'toal' && emergencyRecoveryEnabled && (
                            <div className="space-y-2 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-700">
                                        Emergency Access Fee *
                                    </label>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                        £
                                    </span>
                                    <input
                                        type="number"
                                        value={clzAccessFee}
                                        onChange={e => setClzAccessFee(e.target.value)}
                                        className="w-full pl-10 pr-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-2xl font-bold text-slate-900"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Premium fee for emergency contingency recovery landings.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Earnings Preview */}
                <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-8 flex items-center gap-3">
                        <div className="size-6 rounded-full bg-white border border-emerald-500 flex items-center justify-center">
                            <Check className="size-3.5 text-emerald-500 stroke-3" />
                        </div>
                        Earnings Preview
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500 font-medium">
                                    Access Fee (Base)
                                </span>
                                <span className="font-bold text-slate-900 text-lg">
                                    £
                                    {parsedAccessFee.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>

                            {siteType === 'toal' && emergencyRecoveryEnabled && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500 font-medium">
                                        Emergency Fee
                                    </span>
                                    <span className="font-bold text-slate-900 text-lg">
                                        £
                                        {parsedClzAccessFee.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500 font-medium">
                                    Platform Fee
                                </span>
                                <span className="font-bold text-slate-900 text-lg">
                                    {platformFeeLoading
                                        ? 'Loading...'
                                        : typeof platformFee === 'number'
                                          ? `£${platformFee.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}`
                                          : 'N/A'}
                                </span>
                            </div>

                            <div className="h-px bg-slate-200 mt-2" />

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-base font-bold text-slate-900">
                                    You Receive
                                </span>
                                <div className="text-right">
                                    <span className="text-4xl font-bold text-emerald-500 tracking-tight">
                                        £
                                        {parsedAccessFee.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            </div>
                            {siteType === 'toal' && emergencyRecoveryEnabled && (
                                <p className="text-xs text-slate-400 italic text-right -mt-1 font-medium">
                                    + £
                                    {parsedClzAccessFee.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{' '}
                                    if emergency access is utilised
                                </p>
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500 font-medium">
                                    Operator Pays
                                </span>
                                <span className="text-lg font-bold text-slate-900">
                                    £
                                    {operatorPays.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 p-5 rounded-2xl border border-slate-200/60 mt-4">
                            <p className="text-xs text-slate-400 leading-relaxed italic font-medium">
                                Transparency builds trust. Platform fee is fetched from backend
                                billing plans and shown here exactly as configured.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
