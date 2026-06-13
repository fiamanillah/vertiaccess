'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { LineChart } from './SimpleChart'

interface TrendItem {
  month: string
  assetsAdded: number
  operatorsOnboarded: number
  requestsSubmitted: number
}

interface TrendsAnalyticsProps {
  data: TrendItem[]
}

export default function TrendsAnalytics({ data }: TrendsAnalyticsProps) {
  const chartData = data.map((d) => ({
    label: d.month,
    values: [d.assetsAdded, d.operatorsOnboarded, d.requestsSubmitted],
  }))

  return (
    <Card className="border-muted/60">
      <CardHeader>
        <CardTitle className="tracking-tight text-lg">Platform Growth Trends</CardTitle>
        <CardDescription>
          Monthly Assets Added, Operators Onboarded, and Requests Submitted
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LineChart
          data={chartData}
          seriesNames={['Assets Added', 'Operators Onboarded', 'Requests Submitted']}
          colors={['#3b82f6', '#8b5cf6', '#f59e0b']}
        />
      </CardContent>
    </Card>
  )
}
