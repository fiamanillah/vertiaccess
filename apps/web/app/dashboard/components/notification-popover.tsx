'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Bell, 
  CheckCheck, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  ShieldCheck, 
  CreditCard,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@workspace/ui/components/popover';
import { Button } from '@workspace/ui/components/button';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Separator } from '@workspace/ui/components/separator';
import { cn } from '@workspace/ui/lib/utils';
import { useNotificationStore } from '@/store/use-notification-store';
import type { NotificationType } from '@/services/notification/types';

interface NotificationPopoverProps {
  children: React.ReactNode;
}

export function NotificationPopover({ children }: NotificationPopoverProps) {
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const deleteNotification = useNotificationStore((state) => state.deleteNotification);

  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCheck className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'security': return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      case 'billing': return <CreditCard className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4 text-sky-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 sm:w-96" align="end" sideOffset={10}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm tracking-tight uppercase">Notifications</h4>
            {unreadCount > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2 text-[10px] font-black text-primary">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-[10px] font-bold uppercase hover:bg-primary/5 hover:text-primary transition-colors"
              onClick={() => markAllAsRead()}
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Loading alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-4 px-8 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center opacity-50">
                <Bell className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-xs uppercase tracking-tight text-foreground">No notifications</p>
                <p className="text-[10px] leading-relaxed">You&apos;re all caught up! New updates will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={cn(
                    "group relative flex gap-4 p-4 transition-colors hover:bg-muted/30",
                    !notification.read && "bg-primary/[0.02]"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border border-border/50",
                      !notification.read ? "bg-background" : "bg-muted/50"
                    )}>
                      {getIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 pr-8">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold text-[13px] tracking-tight",
                        notification.read ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <p className={cn(
                      "text-[11px] leading-relaxed line-clamp-2",
                      notification.read ? "text-muted-foreground/70" : "text-muted-foreground"
                    )}>
                      {notification.message}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mt-1">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Mark as read"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/5"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {notification.actionUrl && (
                    <Link 
                      href={notification.actionUrl}
                      className="absolute inset-0 z-0"
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <Separator className="bg-border/50" />
        
        <div className="p-2 bg-muted/20">
          <Button 
            variant="ghost" 
            className="w-full h-8 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all duration-300"
            asChild
          >
            <Link href="/dashboard/notifications" className="flex items-center gap-2">
              View All Notifications
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
