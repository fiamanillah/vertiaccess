import {
    LayoutDashboard,
    Users,
    Settings,
    Search,
    Command,
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
            logo: Command,
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
        { title: 'Overview', url: '/dashboard/admin', icon: LayoutDashboard },
        {
            title: 'Verifications',
            url: '#',
            icon: ShieldCheck,
            badge: 12,
            items: [
                { title: 'Sites', url: '/dashboard/admin/verifications/sites', badge: 5 },
                { title: 'Asset Owner', url: '/dashboard/admin/verifications/assetowner', badge: 3 },
                { title: 'Drone Operator', url: '/dashboard/admin/verifications/operator', badge: 4 },
            ],
        },
        { title: 'Subscription Plans', url: '/dashboard/admin/subscriptions', icon: CreditCard },
        { title: 'User Management', url: '/dashboard/admin/users', icon: Users },
        { title: 'Incident Report', url: '/dashboard/admin/incident-report', icon: Scale },
        { title: 'Analytics', url: '/dashboard/admin/analytics', icon: BarChart3 },
    ],
    // Keep role value 'assetowner' in code/logic/database to align with backend database/Cognito values
    assetOwner: [
        { title: 'Overview', url: '/dashboard/assetowner', icon: LayoutDashboard },
        { title: 'Infrastructure Assets', url: '/dashboard/assetowner/infrastructure', icon: MapPin },
        { title: 'Scheduler', url: '/dashboard/assetowner/scheduler', icon: CalendarClock },
        { title: 'Incident Report', url: '/dashboard/assetowner/incident-report', icon: Scale },
        { title: 'Balance', url: '/dashboard/assetowner/balance', icon: Wallet },
    ],
    operator: [
        { title: 'Dashboard', url: '/dashboard/operator', icon: LayoutDashboard },
        { title: 'Search & Discovery', url: '/dashboard/operator/search', icon: Search },
        { title: 'My Bookings', url: '/dashboard/operator/bookings', icon: Calendar },
        { title: 'Incident Report', url: '/dashboard/operator/incident-report', icon: Scale },
        { title: 'Billing', url: '/dashboard/operator/billing', icon: CreditCard },
    ],
};
