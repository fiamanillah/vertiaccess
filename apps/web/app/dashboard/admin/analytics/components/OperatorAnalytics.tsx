'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table'
import { BarChart } from './SimpleChart'
import { CalendarDays, CalendarRange, CalendarSync } from 'lucide-react'

interface TopOperatorItem {
  operator: string
  requests: number
  requestsPerDay: number
  requestsPerWeek: number
  requestsPerMonth: number
}

interface MissionIntentItem {
  intent: string
  count: number
}

interface MissionRequestedData {
  perDay: number
  perWeek: number
  perMonth: number
}

interface OperatorAnalyticsProps {
  topOperators: TopOperatorItem[]
  intentUsage: MissionIntentItem[]
  requested: MissionRequestedData
}

export default function OperatorAnalytics({
  topOperators,
  intentUsage,
  requested,
}: OperatorAnalyticsProps) {
  // Format bar data
  const barChartData = intentUsage.map((item) => ({
    label: item.intent,
    value: item.count,
  }))

  const requestedStats = [
    {
      label: 'Per Day',
      value: requested.perDay,
      icon: CalendarDays,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      label: 'Per Week',
      value: requested.perWeek,
      icon: CalendarSync,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Per Month',
      value: requested.perMonth,
      icon: CalendarRange,
      color: 'text-purple-500 bg-purple-500/10',
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Top 5 Operators */}
      <Card className="border-muted/60 h-full flex flex-col justify-between">
        <div>
          <CardHeader>
            <CardTitle className="tracking-tight text-lg">Top 5 Operators</CardTitle>
            <CardDescription>
              Volume of Requests Per Day, Week, and Month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Operator</TableHead>
                  <TableHead className="text-right font-semibold">Total</TableHead>
                  <TableHead className="text-right font-semibold">Day</TableHead>
                  <TableHead className="text-right font-semibold">Week</TableHead>
                  <TableHead className="text-right font-semibold">Month</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOperators.length > 0 ? (
                  topOperators.map((op, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{op.operator}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {op.requests}
                      </TableCell>
                      <TableCell className="text-right">{op.requestsPerDay}</TableCell>
                      <TableCell className="text-right">{op.requestsPerWeek}</TableCell>
                      <TableCell className="text-right">{op.requestsPerMonth}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                      No Operator Data Available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </div>
      </Card>

      {/* Mission Intent & Volume Requested */}
      <div className="space-y-6">
        <Card className="border-muted/60">
          <CardHeader>
            <CardTitle className="tracking-tight text-lg">Mission Intent Usage</CardTitle>
            <CardDescription>Request Count Distributed by Operational Objective</CardDescription>
          </CardHeader>
          <CardContent>
            {barChartData.length > 0 ? (
              <BarChart data={barChartData} color="#8b5cf6" />
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No Intent Data Available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-muted/60">
          <CardHeader>
            <CardTitle className="tracking-tight text-lg">Mission Requested</CardTitle>
            <CardDescription>Global Request Submission Velocities</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            {requestedStats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div key={idx} className="flex flex-col items-center p-3 border border-muted/50 rounded-xl bg-muted/10">
                  <div className={`p-2 rounded-lg mb-2 ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                    {stat.label}
                  </span>
                  <span className="text-xl font-bold tracking-tight mt-1">{stat.value}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
