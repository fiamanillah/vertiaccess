import {
    BarChart3,
    CreditCard,
    UserCheck,
    ShieldCheck,
    FileText,
    Users,
    ShieldAlert,
    TrendingUp,
} from 'lucide-react';
import { TabButton } from './TabButton';

interface TabNavigationProps {
    activeView:
        | 'overview'
        | 'landowners'
        | 'operators'
        | 'sites'
        | 'subscription-plans'
        | 'user-mgmt'
        | 'incidents'
        | 'analytics';
    onViewChange: (
        view:
            | 'overview'
            | 'landowners'
            | 'operators'
            | 'sites'
            | 'subscription-plans'
            | 'user-mgmt'
            | 'incidents'
            | 'analytics'
    ) => void;
    pendingVerifications: any[];
    incidentReports: any[];
    isLoading?: boolean;
}

export function TabNavigation({
    activeView,
    onViewChange,
    pendingVerifications,
    incidentReports,
    isLoading = false,
}: TabNavigationProps) {
    return (
        <div className="flex gap-10 border-b border-slate-200 mb-10 overflow-x-auto pb-px [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:display-none">
            <TabButton
                active={activeView === 'overview'}
                onClick={() => onViewChange('overview')}
                icon={<BarChart3 className="size-5" />}
                label="Overview"
                isLoading={isLoading}
            />
            <TabButton
                active={activeView === 'landowners'}
                onClick={() => onViewChange('landowners')}
                icon={<UserCheck className="size-5" />}
                label="Landowner Verifications"
                badge={
                    pendingVerifications.filter(
                        v =>
                            (v.type === 'landowner' ||
                                (v.type === 'identity' && v.userRole !== 'operator')) &&
                            v.status === 'PENDING'
                    ).length
                }
                isLoading={isLoading}
            />
            <TabButton
                active={activeView === 'operators'}
                onClick={() => onViewChange('operators')}
                icon={<ShieldCheck className="size-5" />}
                label="Operator Verifications"
                badge={
                    pendingVerifications.filter(
                        v =>
                            (v.type === 'operator' ||
                                (v.type === 'identity' && v.userRole === 'operator')) &&
                            v.status === 'PENDING'
                    ).length
                }
                isLoading={isLoading}
            />
            <TabButton
                active={activeView === 'sites'}
                onClick={() => onViewChange('sites')}
                icon={<FileText className="size-5" />}
                label="Site Verifications"
                badge={
                    pendingVerifications.filter(v => v.type === 'site' && v.status === 'PENDING')
                        .length
                }
                isLoading={isLoading}
            />
            <TabButton
                active={activeView === 'subscription-plans'}
                onClick={() => onViewChange('subscription-plans')}
                icon={<CreditCard className="size-5" />}
                label="Subscription Plans"
                isLoading={isLoading}
            />
            <TabButton
                active={activeView === 'user-mgmt'}
                onClick={() => onViewChange('user-mgmt')}
                icon={<Users className="size-5" />}
                label="User Management"
                isLoading={isLoading}
            />
            <TabButton
                active={activeView === 'incidents'}
                onClick={() => onViewChange('incidents')}
                icon={<ShieldAlert className="size-5" />}
                label="Safety & Incidents"
                badge={incidentReports.filter(r => r.status === 'OPEN').length}
                isLoading={isLoading}
            />
            <TabButton
                active={activeView === 'analytics'}
                onClick={() => onViewChange('analytics')}
                icon={<TrendingUp className="size-5" />}
                label="Analytics"
                isLoading={isLoading}
            />
        </div>
    );
}
