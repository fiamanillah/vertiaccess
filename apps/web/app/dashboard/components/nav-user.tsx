'use client';

import {
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    CreditCard,
    LogOut,
    Sparkles,
    Loader2,
} from 'lucide-react';

import Link from 'next/link';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { authService } from '@/services/auth/auth.service';
import { toast } from 'sonner';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@workspace/ui/components/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@workspace/ui/components/sidebar';

export function NavUser({
    user,
}: {
    user: {
        name: string;
        email: string;
        avatar: string;
    };
}) {
    const { isMobile } = useSidebar();
    const router = useRouter();
    const logoutStore = useAuthStore(state => state.logout);
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const initials = getInitials(user.name);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            // 1. Call backend logout (if exists)
            await authService.logout();
            
            // 2. Clear store and cookies
            logoutStore();
            
            // 3. Notify and Redirect
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if backend fails, we should clear local state
            logoutStore();
            router.push('/login');
        }
    };

    return (
        <>
            {isLoggingOut && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-background/40 border border-border/50 shadow-2xl">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                            <Loader2 className="size-10 text-primary animate-spin relative" />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <h2 className="text-lg font-bold tracking-tight">Signing out safely</h2>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Please wait a moment</p>
                        </div>
                    </div>
                </div>
            )}

            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user.name}</span>
                                    <span className="truncate text-xs">{user.email}</span>
                                </div>
                                <ChevronsUpDown className="ml-auto size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            side={isMobile ? 'bottom' : 'right'}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user.name}</span>
                                        <span className="truncate text-xs">{user.email}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <Sparkles className="mr-2 size-4" />
                                    Upgrade to Pro
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <Link href="/dashboard/profile">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <BadgeCheck className="mr-2 size-4" />
                                        Account
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem>
                                    <CreditCard className="mr-2 size-4" />
                                    Billing
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Bell className="mr-2 size-4" />
                                    Notifications
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                <LogOut className="mr-2 size-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
}
