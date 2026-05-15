'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@workspace/ui/components/sidebar'

import { Command } from 'lucide-react'
import { NavMain } from './nav-main'
import { PlanUpgradeBox } from './plan-upgrade-box'
import { NavUser } from './nav-user'
import { roleNavItems } from './nav-data'
import Link from 'next/link'
import { useAuthStore } from '@/store/use-auth-store'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const role = (pathname.split('/')[2] ||
    'landowner') as keyof typeof roleNavItems

  const currentNavMain = roleNavItems[role] || roleNavItems.landowner

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">VertiAccess</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={currentNavMain} />
        <PlanUpgradeBox />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user ? `${user.firstName} ${user.lastName}` : 'Guest User',
            email: user?.email || 'guest@example.com',
            avatar: `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
