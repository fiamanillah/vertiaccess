import {
    LayoutDashboard,
    Users,
    Settings,
    Search,
    LifeBuoy,
    Send,
    Calendar,
    ShieldAlert,
    FileCheck,
    ShieldCheck,
    CreditCard,
    BarChart3,
    MapPin,
    CalendarClock,
    Wallet,
    Scale,
    Plane,
} from 'lucide-react';


export const data = {
    user: {
        name: 'Demo User',
        email: 'demo@example.com',
        avatar: 'https://github.com/shadcn.png',
    },
    teams: [
        {
            name: 'VertiAccess',
            logo: () => null,
            plan: 'Enterprise',
        },
    ],
    navSecondary: [
        {
            title: 'Support',
            url: '#',
            icon: LifeBuoy,
        },
        {
            title: 'Feedback',
            url: '#',
            icon: Send,
        },
    ],
    notifications: [
        {
            id: '1',
            title: 'New Site Request',
            description: 'A new site has been submitted for verification.',
            time: '2 minutes ago',
            unread: true,
        },
        {
            id: '2',
            title: 'Booking Confirmed',
            description: 'Your booking for Site A has been confirmed.',
            time: '1 hour ago',
            unread: true,
        },
        {
            id: '3',
            title: 'System Update',
            description: 'Platform maintenance scheduled for tonight.',
            time: 'Yesterday',
            unread: false,
        },
        {
            id: '4',
            title: 'New Message',
            description: 'You have a new message from Support.',
            time: '2 days ago',
            unread: false,
        },
        {
            id: '5',
            title: 'Security Alert',
            description: 'New login detected from a new device.',
            time: '3 days ago',
            unread: true,
        },
        {
            id: '6',
            title: 'Payment Received',
            description: 'Your payment for the Enterprise plan has been received.',
            time: '4 days ago',
            unread: false,
        },
        {
            id: '7',
            title: 'Profile Updated',
            description: 'Your profile information has been successfully updated.',
            time: '5 days ago',
            unread: false,
        },
        {
            id: '8',
            title: 'New Feature',
            description: 'Check out the new analytics dashboard!',
            time: '1 week ago',
            unread: true,
        },
    ],
};

export const roleNavItems = {
    admin: [
        { title: 'Dashboard', url: '/dashboard/admin', icon: LayoutDashboard },
        { title: 'Infrastructure Assets', url: '/dashboard/admin/sites', icon: MapPin },
        { title: 'Drone Operations', url: '/dashboard/admin/operations', icon: Calendar },
        {
            title: 'Verifications',
            url: '#',
            icon: ShieldCheck,
            badge: 12,
            items: [
                { title: 'Assets', url: '/dashboard/admin/verifications/sites', badge: 5 },
                { title: 'Asset Manager', url: '/dashboard/admin/verifications/assetmanager', badge: 3 },
                { title: 'Drone Operator', url: '/dashboard/admin/verifications/operator', badge: 4 },
            ],
        },
        { title: 'Subscription Plan', url: '/dashboard/admin/subscriptions', icon: CreditCard },
        { title: 'User Account Management', url: '/dashboard/admin/users', icon: Users },
        { title: 'Incident Report', url: '/dashboard/admin/incident-report', icon: Scale },
        { title: 'Notify', url: '/dashboard/admin/notify', icon: Send },
        { title: 'Analytics', url: '/dashboard/admin/analytics', icon: BarChart3 },
    ],
    // Keep role value 'assetmanager' in code/logic/database to align with backend database/Cognito values
    assetManager: [
        { title: 'Overview', url: '/dashboard/assetmanager', icon: LayoutDashboard },
        { title: 'Infrastructure Assets', url: '/dashboard/assetmanager/infrastructure', icon: MapPin },
        { title: 'Scheduler', url: '/dashboard/assetmanager/scheduler', icon: CalendarClock },
        { title: 'Incident Report', url: '/dashboard/assetmanager/incident-report', icon: Scale },
        { title: 'Balance', url: '/dashboard/assetmanager/balance', icon: Wallet },
    ],
    operator: [
        { title: 'Dashboard', url: '/dashboard/operator', icon: LayoutDashboard },
        { title: 'Asset Network', url: '/dashboard/operator/search', icon: Search },
        { title: 'Mission Planning', url: '/dashboard/operator/bookings', icon: Calendar },
        { title: 'Aircraft', url: '/dashboard/operator/aircraft', icon: Plane },
        { title: 'Incident Reporting', url: '/dashboard/operator/incident-report', icon: Scale },
        { title: 'Billing', url: '/dashboard/operator/billing', icon: CreditCard },
    ],
};
