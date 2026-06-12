'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { notificationService } from '@/services/notification/notification.service'
import { NotificationHeader } from './components/notification-header'
import { NotificationForm } from './components/notification-form'
import { NotificationPreview } from './components/notification-preview'
import { notificationFormSchema, NotificationFormValues } from './types'

export default function NotifyPage() {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      type: 'info',
      title: '',
      message: '',
      actionUrl: '',
    },
  })

  // Watch values in real-time to pass to the preview panel
  const formValues = form.watch()

  const onSubmit = async (data: NotificationFormValues) => {
    setIsLoading(true)
    try {
      const payload = {
        userId: 'all',
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl || undefined,
      }

      const res = await notificationService.createNotification(payload)

      if (res.success) {
        const count = res.data?.broadcastedToCount ?? 0
        toast.success('Alert Broadcasted Successfully', {
          description: `Broadcasting finished! Sent notification to all ${count} active platform users.`,
        })
        form.reset({
          type: 'info',
          title: '',
          message: '',
          actionUrl: '',
        })
      } else {
        toast.error('Failed to Broadcast Notification', {
          description: res.message || 'An unknown server error occurred.',
        })
      }
    } catch (error: any) {
      console.error('Error broadcasting notification:', error)
      const errorMsg = error?.message || 'A network error occurred while attempting to send the notification.'
      toast.error('Failed to Broadcast Notification', {
        description: errorMsg,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <NotificationHeader />

      {/* Two-Column Form and Preview Grid */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Composer Form Column */}
        <div className="lg:col-span-7">
          <Card className="border shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Compose Announcement</CardTitle>
              <CardDescription>
                Write and customize your message to send out. Broadcasts are instantaneous and final.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationForm
                form={form}
                onSubmit={onSubmit}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <NotificationPreview values={formValues} />
        </div>
      </div>
    </div>
  )
}
