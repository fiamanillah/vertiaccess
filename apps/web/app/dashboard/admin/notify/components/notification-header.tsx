'use client'

import React from 'react'

export function NotificationHeader() {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">Platform Notifications</h1>
      <p className="text-muted-foreground">
        Broadcast system-wide notices, maintenance alerts, or general updates to all users.
      </p>
    </div>
  )
}
