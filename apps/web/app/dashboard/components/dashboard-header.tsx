'use client';

import { Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { Separator } from '@workspace/ui/components/separator';
import { Input } from '@workspace/ui/components/input';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { data } from './nav-data';
import { NotificationsDropdown } from './notifications';
import { ModeToggle } from '@/components/mode-toggle';

export function DashboardHeader() {
    const pathname = usePathname();
    const role = pathname.split('/')[2] || 'landowner';

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-7"
                />
                <div className="relative hidden sm:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search everything..."
                        className="w-64 pl-8 md:w-80 lg:w-96 bg-muted/50"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <ModeToggle />
                <NotificationsDropdown />
                <Link 
                    href="/dashboard/profile"
                    className="flex items-center gap-3 pl-2 border-l hover:opacity-80 transition-opacity"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium leading-none">{data.user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{role}</p>
                    </div>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={data.user.avatar} />
                        <AvatarFallback>DU</AvatarFallback>
                    </Avatar>
                </Link>
            </div>
        </header>
    );
}
