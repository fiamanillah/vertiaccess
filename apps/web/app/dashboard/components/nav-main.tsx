'use client'

import { ChevronRight, type LucideIcon } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuBadge,
} from '@workspace/ui/components/sidebar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@workspace/ui/lib/utils'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    badge?: string | number
    items?: {
      title: string
      url: string
      badge?: string | number
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isActive}
            >
              <SidebarMenuItem>
                {item.items?.length && item.url === '#' ? (
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      className={
                        isActive
                          ? 'text-primary hover:text-primary [&>svg]:size-5 my-1'
                          : ' [&>svg]:size-5 my-1'
                      }
                    >
                      <item.icon className={isActive ? 'text-primary' : ''} />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                    className={
                      isActive
                        ? 'text-primary hover:text-primary [&>svg]:size-5 my-1'
                        : ' [&>svg]:size-5 my-1'
                    }
                  >
                    <Link href={item.url}>
                      <item.icon className={isActive ? 'text-primary' : ''} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
                {item.badge && (
                  <SidebarMenuBadge className="bg-amber-100 text-amber-700 border-amber-200">
                    {item.badge}
                  </SidebarMenuBadge>
                )}
                {item.items?.length ? (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const isSubActive = pathname === subItem.url
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                            >
                              <Link
                                href={subItem.url}
                                className={cn(
                                  'flex items-center justify-between w-full h-9',
                                  isSubActive ? 'text-primary' : '',
                                )}
                              >
                                <span>{subItem.title}</span>
                                {subItem.badge && (
                                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-md bg-amber-100 px-1 text-[10px] font-bold text-amber-700 border border-amber-200">
                                    {subItem.badge}
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
