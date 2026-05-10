'use client';

import { Bell } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';
import { data } from './nav-data';
import { useState } from 'react';
import Link from 'next/link';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@workspace/ui/components/pagination';

const ITEMS_PER_PAGE = 3;

const MAX_DISPLAY = 5;

export function NotificationsDropdown() {
    const [notifications, setNotifications] = useState(data.notifications);
    const unreadCount = notifications.filter(n => n.unread).length;
    const latestNotifications = notifications.slice(0, MAX_DISPLAY);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n => (n.id === id ? { ...n, unread: false } : n)));
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">Notifications</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                You have {unreadCount} unread messages.
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                                onClick={markAllAsRead}
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[400px] overflow-y-auto">
                    {latestNotifications.map(notification => (
                        <DropdownMenuItem
                            key={notification.id}
                            className="flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-accent"
                            onClick={() => markAsRead(notification.id)}
                        >
                            <div className="flex w-full items-center justify-between">
                                <span
                                    className={`text-sm font-semibold flex gap-2 ${notification.unread ? 'text-foreground' : 'text-muted-foreground'}`}
                                >
                                    {notification.unread && (
                                        <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                    {notification.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {notification.time}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.description}
                            </p>
                        </DropdownMenuItem>
                    ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href="/dashboard/notifications"
                        className="w-full text-center text-xs text-muted-foreground justify-center py-2 cursor-pointer"
                    >
                        View all notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
