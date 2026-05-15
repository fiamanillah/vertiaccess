'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useNotificationStore } from '@/store/use-notification-store';
import { NotificationPopover } from './notification-popover';

export function NotificationBell() {
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);

    React.useEffect(() => {
        fetchUnreadCount();
        
        // Poll for unread count every 60 seconds
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    return (
        <NotificationPopover>
            <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full bg-background border border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-300"
            >
                <Bell className="h-[1.1rem] w-[1.1rem] text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-background animate-in zoom-in-50 duration-300">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>
        </NotificationPopover>
    );
}
