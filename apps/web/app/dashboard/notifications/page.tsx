'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { data } from '../components/nav-data';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@workspace/ui/components/pagination';
import { Button } from '@workspace/ui/components/button';

const ITEMS_PER_PAGE = 5;

export default function NotificationsPage() {
    const [notifications, setNotifications] = React.useState(data.notifications);
    const [currentPage, setCurrentPage] = React.useState(1);

    const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedNotifications = notifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n => (n.id === id ? { ...n, unread: false } : n)));
    };

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        Stay updated with the latest platform activities.
                    </p>
                </div>
                {notifications.some(n => n.unread) && (
                    <Button onClick={markAllAsRead} variant="outline" size="sm">
                        Mark all as read
                    </Button>
                )}
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        You have {notifications.filter(n => n.unread).length} unread notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {paginatedNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`flex flex-col gap-1 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${notification.unread ? 'bg-muted/30 border-primary/20' : 'bg-background'}`}
                            onClick={() => markAsRead(notification.id)}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`font-semibold flex items-center gap-2 ${notification.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {notification.unread && (
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                    )}
                                    {notification.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {notification.time}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {notification.description}
                            </p>
                        </div>
                    ))}
                    
                    {notifications.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-muted-foreground">No notifications yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="mt-auto py-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                                    }}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                            {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        href="#"
                                        isActive={currentPage === i + 1}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage(i + 1);
                                        }}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                    }}
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
