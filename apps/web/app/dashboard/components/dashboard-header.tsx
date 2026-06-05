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
import { siteService } from '@/services/site.service';
import { bookingService } from '@/services/booking.service';
import { incidentQueryService } from '@/services/incident-query.service';
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
    const role = (user?.role || pathname.split('/')[2] || 'landowner').toLowerCase();
    const segments = pathname.split('/').filter(Boolean);

    const resolvedNamesRef = React.useRef<Record<string, string>>({});
    const [resolvedNames, setResolvedNames] = React.useState<Record<string, string>>({});

    const getSegmentClass = (segment: string) => {
        const val = resolvedNames[segment] || segment;
        return val.toUpperCase().startsWith('VA-') ? 'uppercase' : 'capitalize';
    };

    React.useEffect(() => {
        let active = true;
        const fetchNames = async () => {
            const currentSegments = pathname.split('/').filter(Boolean);
            const newNames: Record<string, string> = {};
            let hasUpdates = false;

            for (let i = 0; i < currentSegments.length; i++) {
                const segment = currentSegments[i]!;
                const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
                             /^c[a-z0-9]{24}$/i.test(segment) ||
                             /^[0-9a-fA-F]{24}$/.test(segment);

                if (isId && !resolvedNamesRef.current[segment]) {
                    const isSite = (i > 0 && currentSegments[i - 1] === 'infrastructure') ||
                                   (i > 1 && currentSegments[i - 2] === 'infrastructure' && currentSegments[i - 1] === 'edit') ||
                                   (i > 0 && currentSegments[i - 1] === 'search');

                    const isBooking = (i > 0 && currentSegments[i - 1] === 'scheduler') ||
                                      (i > 0 && currentSegments[i - 1] === 'bookings') ||
                                      (i > 1 && currentSegments[i - 2] === 'scheduler' && currentSegments[i - 1] === 'review');

                    const isIncident = (i > 0 && currentSegments[i - 1] === 'incident-report');

                    try {
                        if (isSite) {
                            let siteName = '';
                            try {
                                const res = await siteService.getPublicSite(segment);
                                if (res.success && res.data?.name) {
                                    siteName = res.data.name;
                                }
                            } catch (e) {
                                // Ignore
                            }

                            if (!siteName) {
                                try {
                                    const res = await siteService.getSite(segment);
                                    if (res.success && res.data?.name) {
                                        siteName = res.data.name;
                                    }
                                } catch (e) {
                                    // Ignore
                                }
                            }

                            if (siteName && active) {
                                newNames[segment] = siteName;
                                hasUpdates = true;
                            }
                        } else if (isBooking) {
                            try {
                                const booking = await bookingService.getBooking(segment);
                                if (booking?.siteName && active) {
                                    newNames[segment] = booking.siteName;
                                    hasUpdates = true;
                                } else if (booking?.bookingReference && active) {
                                    newNames[segment] = `Request: ${booking.bookingReference}`;
                                    hasUpdates = true;
                                }
                            } catch (e) {
                                // Ignore
                            }
                        } else if (isIncident) {
                            try {
                                const incident = await incidentQueryService.getIncident(segment);
                                if (incident?.reference && active) {
                                    newNames[segment] = incident.reference.toUpperCase();
                                    hasUpdates = true;
                                }
                            } catch (e) {
                                // Ignore
                            }
                        }
                    } catch (err) {
                        console.error('Failed to resolve breadcrumb name for ID:', segment, err);
                    }
                }
            }

            if (hasUpdates && active) {
                Object.assign(resolvedNamesRef.current, newNames);
                setResolvedNames({ ...resolvedNamesRef.current });
            }
        };

        fetchNames();

        return () => {
            active = false;
        };
    }, [pathname]);

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
                                        <Link href={`/${segments[0]}`} className={getSegmentClass(segments[0]!)}>{resolvedNames[segments[0]!] || segments[0]!.replace(/-/g, ' ')}</Link>
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
                                                        <Link href={path} className={`${getSegmentClass(segment)} w-full`}>
                                                            {resolvedNames[segment] || segment.replace(/-/g, ' ')}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                );
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className={getSegmentClass(segments[segments.length - 1]!)}>{resolvedNames[segments[segments.length - 1]!] || segments[segments.length - 1]!.replace(/-/g, ' ')}</BreadcrumbPage>
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
                                                <BreadcrumbPage className={getSegmentClass(segment)}>{resolvedNames[segment] || segment.replace(/-/g, ' ')}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <Link href={path} className={getSegmentClass(segment)}>{resolvedNames[segment] || segment.replace(/-/g, ' ')}</Link>
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
