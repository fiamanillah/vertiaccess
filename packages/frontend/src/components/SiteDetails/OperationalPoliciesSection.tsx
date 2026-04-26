import type { Site } from '../../types';
import { SectionTitle } from './SectionTitle';
import { ChevronRight, Shield } from 'lucide-react';
import { Badge } from './SiteBadge';

interface OperationalPoliciesSectionProps {
    site: Site;
    isEditing: boolean;
    autoApprove: boolean;
    setAutoApprove: (val: boolean) => void;
    clzEnabled: boolean;
    setClzEnabled: (val: boolean) => void;
}

export function OperationalPoliciesSection({
    site,
    isEditing,
    autoApprove,
    setAutoApprove,
    clzEnabled,
    setClzEnabled,
}: OperationalPoliciesSectionProps) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <SectionTitle>Operational Policies</SectionTitle>
            <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-medium">Booking Protocol</span>
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <select
                                value={autoApprove ? 'auto' : 'manual'}
                                onChange={e => setAutoApprove(e.target.value === 'auto')}
                                className="text-sm font-bold text-blue-600 bg-transparent outline-none cursor-pointer appearance-none"
                            >
                                <option value="manual">Manual</option>
                                <option value="auto">Auto Approval</option>
                            </select>
                            <ChevronRight className="size-3 text-blue-600 rotate-90" />
                        </div>
                    ) : (
                        <Badge variant={site.autoApprove ? 'green' : 'amber'}>
                            {site.autoApprove ? 'Auto Approval' : 'Manual'}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-medium">
                        Emergency & Recovery Site Status
                    </span>
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <select
                                value={clzEnabled ? 'enabled' : 'disabled'}
                                onChange={e => setClzEnabled(e.target.value === 'enabled')}
                                className="text-sm font-bold text-blue-600 bg-transparent outline-none cursor-pointer appearance-none"
                            >
                                <option value="enabled">Enabled</option>
                                <option value="disabled">Disabled</option>
                            </select>
                            <ChevronRight className="size-3 text-blue-600 rotate-90" />
                        </div>
                    ) : (
                        <span
                            className={`text-sm font-bold ${site.clzEnabled ? 'text-emerald-600' : 'text-slate-400'}`}
                        >
                            {site.clzEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    )}
                </div>
                <div className="pt-2">
                    <p className="text-xs font-black text-slate-400 uppercase mb-2">
                        Access Guidelines
                    </p>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                        <Shield className="size-4 text-slate-400" />
                        <span className="text-sm text-slate-500 italic">
                            {site.policyDocument
                                ? 'Safety manual active'
                                : 'Default guidelines apply'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
