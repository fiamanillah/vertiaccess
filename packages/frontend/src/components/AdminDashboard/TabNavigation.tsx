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
    badgeCounts: {
        landowners?: number;
        operators?: number;
        sites?: number;
        incidents?: number;
    };
    badgeLoading?: {
        landowners?: boolean;
        operators?: boolean;
        sites?: boolean;
        incidents?: boolean;
    };
}

export function TabNavigation({
    activeView,
    onViewChange,
    badgeCounts,
    badgeLoading,
}: TabNavigationProps) {
    return (
        <div className="flex gap-10 border-b border-slate-200 mb-10 overflow-x-auto pb-px [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:display-none">
            <TabButton
                active={activeView === 'overview'}
                onClick={() => onViewChange('overview')}
                icon={<BarChart3 className="size-5" />}
                label="Overview"
            />
            <TabButton
                active={activeView === 'landowners'}
                onClick={() => onViewChange('landowners')}
                icon={<UserCheck className="size-5" />}
                label="Landowner Verifications"
                badge={badgeCounts.landowners}
                isLoading={badgeLoading?.landowners}
            />
            <TabButton
                active={activeView === 'operators'}
                onClick={() => onViewChange('operators')}
                icon={<ShieldCheck className="size-5" />}
                label="Operator Verifications"
                badge={badgeCounts.operators}
                isLoading={badgeLoading?.operators}
            />
            <TabButton
                active={activeView === 'sites'}
                onClick={() => onViewChange('sites')}
                icon={<FileText className="size-5" />}
                label="Site Verifications"
                badge={badgeCounts.sites}
                isLoading={badgeLoading?.sites}
            />
            <TabButton
                active={activeView === 'subscription-plans'}
                onClick={() => onViewChange('subscription-plans')}
                icon={<CreditCard className="size-5" />}
                label="Subscription Plans"
            />
            <TabButton
                active={activeView === 'user-mgmt'}
                onClick={() => onViewChange('user-mgmt')}
                icon={<Users className="size-5" />}
                label="User Management"
            />
            <TabButton
                active={activeView === 'incidents'}
                onClick={() => onViewChange('incidents')}
                icon={<ShieldAlert className="size-5" />}
                label="Safety & Incidents"
                badge={badgeCounts.incidents}
                isLoading={badgeLoading?.incidents}
            />
            <TabButton
                active={activeView === 'analytics'}
                onClick={() => onViewChange('analytics')}
                icon={<TrendingUp className="size-5" />}
                label="Analytics"
            />
        </div>
    );
}
