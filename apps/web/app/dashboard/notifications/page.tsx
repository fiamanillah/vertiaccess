'use client'

import * as React from 'react'
import {
  CheckCheck,
  Info,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Trash2,
  Bell,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@workspace/ui/components/pagination'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { useNotificationStore } from '@/store/use-notification-store'
import type { NotificationType } from '@/services/notification/types'

const ITEMS_PER_PAGE = 10

export default function NotificationsPage() {
  const notifications = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const isLoading = useNotificationStore((state) => state.isLoading)
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
  const deleteNotification = useNotificationStore((state) => state.deleteNotification)

  const [currentPage, setCurrentPage] = React.useState(1)

  React.useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedNotifications = notifications.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  )

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCheck className="h-5 w-5 text-emerald-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'security':
        return <ShieldCheck className="h-5 w-5 text-blue-500" />
      case 'billing':
        return <CreditCard className="h-5 w-5 text-purple-500" />
      default:
        return <Info className="h-5 w-5 text-sky-500" />
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 max-w-5xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Stay updated with the latest platform activities and security
            alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={() => markAllAsRead()}
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest h-9"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="grid gap-4 px-0">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Synchronizing alerts...
            </p>
          </div>
        ) : paginatedNotifications.length > 0 ? (
          <div className="space-y-4">
            {paginatedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'group relative flex items-start gap-4 p-5 rounded-xl border transition-all duration-300',
                  !notification.read
                    ? 'bg-primary/[0.03] border-primary/20 shadow-sm ring-1 ring-primary/5'
                    : 'bg-background border-border/50 hover:border-border hover:bg-muted/30',
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/50 shadow-sm transition-transform group-hover:scale-105',
                    !notification.read ? 'bg-background' : 'bg-muted/50',
                  )}
                >
                  {getIcon(notification.type)}
                </div>

                <div className="flex-1 space-y-1 pr-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={cn(
                          'font-bold text-sm tracking-tight',
                          notification.read
                            ? 'text-muted-foreground'
                            : 'text-foreground',
                        )}
                      >
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                      {formatDistanceToNow(new Date(notification.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-[13px] leading-relaxed max-w-2xl',
                      notification.read
                        ? 'text-muted-foreground/70'
                        : 'text-muted-foreground',
                    )}
                  >
                    {notification.message}
                  </p>
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full"
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-full"
                    onClick={() => deleteNotification(notification.id)}
                    title="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed rounded-2xl bg-muted/20 border-border/50">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="font-bold uppercase text-xs tracking-widest">
                Inbox Zero
              </p>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                No notifications to show at this time.
              </p>
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="py-8 border-t border-border/40">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={cn(
                    'font-bold uppercase text-[10px] tracking-widest',
                    currentPage === 1 && 'pointer-events-none opacity-50',
                  )}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === i + 1}
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(i + 1)
                    }}
                    className="font-bold text-xs h-9 w-9"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1)
                  }}
                  className={cn(
                    'font-bold uppercase text-[10px] tracking-widest',
                    currentPage === totalPages &&
                      'pointer-events-none opacity-50',
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
