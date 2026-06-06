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

import Image from 'next/image'
import { NavMain } from './nav-main'
import { NavUser } from './nav-user'
import { roleNavItems } from './nav-data'
import Link from 'next/link'
import { useAuthStore } from '@/store/use-auth-store'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const role = ((user?.role || pathname.split('/')[2] ||
    'assetmanager') as string).toLowerCase() as keyof typeof roleNavItems

  const currentNavMain = roleNavItems[role] || roleNavItems.assetManager

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent">
              <Link href="/dashboard">
                {/* Collapsed state: show only icon */}
                <div className="group-data-[collapsible=icon]:flex hidden aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                  <Image src="/icon.png" alt="VertiAccess Icon" width={24} height={24} className="object-contain" />
                </div>
                
                {/* Expanded state: show full logo */}
                <div className="group-data-[collapsible=icon]:hidden flex items-center justify-center">
                  <Image src="/logo.png" alt="VertiAccess Logo" width={130} height={32} className="object-contain" />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={currentNavMain} />
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
