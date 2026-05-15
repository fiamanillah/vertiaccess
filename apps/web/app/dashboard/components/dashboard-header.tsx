'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { Separator } from '@workspace/ui/components/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { NotificationBell } from './notification-bell';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuthStore } from '@/store/use-auth-store';
import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export function DashboardHeader() {
    const pathname = usePathname();
    const user = useAuthStore(state => state.user);
    const role = pathname.split('/')[2] || 'landowner';
    const segments = pathname.split('/').filter(Boolean);

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-6 border-b sticky top-0 z-60 bg-background">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-7"
                />

                <Breadcrumb className="hidden sm:flex">
                    <BreadcrumbList>
                        {segments.length > 3 ? (
                            <>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={`/${segments[0]}`} className="capitalize">{segments[0]!.replace(/-/g, ' ')}</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="flex items-center gap-1 outline-none">
                                            <BreadcrumbEllipsis className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {segments.slice(1, -1).map((segment, index) => {
                                                const path = `/${segments.slice(0, index + 2).join('/')}`;
                                                return (
                                                    <DropdownMenuItem key={path} asChild className="cursor-pointer">
                                                        <Link href={path} className="capitalize w-full">
                                                            {segment.replace(/-/g, ' ')}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                );
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="capitalize">{segments[segments.length - 1]!.replace(/-/g, ' ')}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </>
                        ) : (
                            segments.map((segment, index) => {
                                const isLast = index === segments.length - 1;
                                const path = `/${segments.slice(0, index + 1).join('/')}`;

                                return (
                                    <React.Fragment key={path}>
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage className="capitalize">{segment.replace(/-/g, ' ')}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <Link href={path} className="capitalize">{segment.replace(/-/g, ' ')}</Link>
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && <BreadcrumbSeparator />}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
                <ModeToggle />
                <NotificationBell />
                <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 pl-2 border-l hover:opacity-80 transition-opacity"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium leading-none">
                            {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{role}</p>
                    </div>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`} />
                        <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                </Link>
            </div>
        </header>
    );
}
