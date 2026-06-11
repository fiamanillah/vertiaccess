'use client'

import * as React from 'react'
import { useAuthStore } from '@/store/use-auth-store'
import { AlertBanners } from './_components/alert-banners'
import { MetricsGrid } from './_components/metrics-grid'
import { NeedsAttention } from './_components/needs-attention'
import { TodaySchedule } from './_components/today-schedule'

export default function Page() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex flex-1 flex-col gap-8 max-w-7xl mx-auto p-4">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user?.firstName || 'User'} {user?.lastName || ''}
        </h1>
      </div>

      {/* Global Alert Banners (Morning Briefing) */}
      <AlertBanners />

      {/* At-a-Glance Metrics */}
      <MetricsGrid />

      {/* Core Workflow (Split View) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Needs Your Attention */}
        <NeedsAttention />

        {/* Right Column: On Your Property Today */}
        <TodaySchedule />
      </div>
    </div>
  )
}
