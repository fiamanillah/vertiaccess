import type { User } from '../App';
import { LogOut, User as UserIcon, Bell, Loader2 } from 'lucide-react';
import logoImage from 'figma:asset/0b53c0873b105a341a5c8338c3e36bbbce01dbcb.png';
import { VertiAccessLogo } from './VertiAccessLogo';
import { NotificationsDropdown } from './NotificationsDropdown';
import type { Notification } from './NotificationsDropdown';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    onOpenProfile?: () => void;
    showNotifications?: boolean;
    onToggleNotifications?: () => void;
    notificationCount?: number;
    notifications?: Notification[];
    onMarkAsRead?: (id: string) => void;
    onMarkAllAsRead?: () => void;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
    onPrevPage?: () => void;
    onNextPage?: () => void;
    notificationsLoading?: boolean;
}

export function Header({
    user,
    onLogout,
    onOpenProfile,
    showNotifications,
    onToggleNotifications,
    notificationCount,
    notifications = [],
    onMarkAsRead = () => {},
    onMarkAllAsRead = () => {},
    pagination,
    onPrevPage,
    onNextPage,
    notificationsLoading = false,
}: HeaderProps) {
    return (
        <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <VertiAccessLogo className="h-10" />
                    <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                    <span className="text-slate-400 text-sm font-medium hidden sm:block">
                        {user.role === 'landowner'
                            ? 'Landowner Portal'
                            : user.role === 'operator'
                              ? 'Operator Portal'
                              : 'Admin Portal'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900">
                            {user.fullName || user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                    </div>
                    {onToggleNotifications && (
                        <div className="relative">
                            <button
                                onClick={onToggleNotifications}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
                                title="Notifications"
                            >
                                <Bell className="size-5" />
                                {notificationsLoading && (
                                    <Loader2 className="size-3.5 animate-spin absolute -bottom-0.5 -right-0.5 text-indigo-600 bg-white rounded-full" />
                                )}
                                {notificationCount && notificationCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full -mt-1 -mr-1">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>
                            {showNotifications && (
                                <NotificationsDropdown
                                    notifications={notifications}
                                    pagination={pagination}
                                    onClose={onToggleNotifications}
                                    onMarkAsRead={onMarkAsRead}
                                    onMarkAllAsRead={onMarkAllAsRead}
                                    onPrevPage={onPrevPage}
                                    onNextPage={onNextPage}
                                    isLoading={notificationsLoading}
                                />
                            )}
                        </div>
                    )}
                    {onOpenProfile && (
                        <button
                            onClick={onOpenProfile}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="My Profile"
                        >
                            <UserIcon className="size-5" />
                        </button>
                    )}
                    <button
                        onClick={onLogout}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut className="size-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
