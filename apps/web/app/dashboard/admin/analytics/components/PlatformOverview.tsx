'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import {
  Layers,
  Users,
  Shield,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react'

interface PlatformOverviewProps {
  data: {
    totalAssets: number
    totalAssetManagers: number
    totalOperators: number
    totalRequests: number
    totalApprovedRequests: number
    totalRejectedRequests: number
    totalCancelledRequests: number
    totalExpiredRequests: number
    activeSubscriptions: number
  }
}

export default function PlatformOverview({ data }: PlatformOverviewProps) {
  const cards = [
    {
      title: 'Total Assets',
      value: data.totalAssets,
      icon: Layers,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      title: 'Total Asset Managers',
      value: data.totalAssetManagers,
      icon: Shield,
      color: 'text-indigo-500 bg-indigo-500/10',
    },
    {
      title: 'Total Operators',
      value: data.totalOperators,
      icon: Users,
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      title: 'Total Requests',
      value: data.totalRequests,
      icon: FileText,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      title: 'Total Approved Requests',
      value: data.totalApprovedRequests,
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'Total Rejected Requests',
      value: data.totalRejectedRequests,
      icon: XCircle,
      color: 'text-rose-500 bg-rose-500/10',
    },
    {
      title: 'Total Cancelled Requests',
      value: data.totalCancelledRequests,
      icon: AlertTriangle,
      color: 'text-orange-500 bg-orange-500/10',
    },
    {
      title: 'Total Expired Requests',
      value: data.totalExpiredRequests,
      icon: Clock,
      color: 'text-gray-500 bg-gray-500/10',
    },
    {
      title: 'Active Subscriptions',
      value: data.activeSubscriptions,
      icon: Sparkles,
      color: 'text-teal-500 bg-teal-500/10',
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Platform Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <Card key={idx} className="overflow-hidden border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium tracking-tight text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {card.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
