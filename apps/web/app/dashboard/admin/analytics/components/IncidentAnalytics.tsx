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
import { Badge } from '@workspace/ui/components/badge'

interface IncidentSafetyData {
  low: number
  medium: number
  high: number
  critical: number
}

interface IncidentAnalyticsProps {
  data: IncidentSafetyData
}

export default function IncidentAnalytics({ data }: IncidentAnalyticsProps) {
  const severities = [
    {
      level: 'Low',
      count: data.low,
      badgeColor: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-blue-500/20',
      description: 'Minor issues, no system interruption or safety risk.',
    },
    {
      level: 'Medium',
      count: data.medium,
      badgeColor: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-amber-500/20',
      description: 'Equipment warning status or schedule disruptions.',
    },
    {
      level: 'High',
      count: data.high,
      badgeColor: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/10 border-orange-500/20',
      description: 'Immediate landing deviations or structural collision warnings.',
    },
    {
      level: 'Critical',
      count: data.critical,
      badgeColor: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/10 border-rose-500/20',
      description: 'Airframe crash, system failure or regulatory breaches.',
    },
  ]

  return (
    <Card className="border-muted/60">
      <CardHeader>
        <CardTitle className="tracking-tight text-lg">Incident and Safety Analytics</CardTitle>
        <CardDescription>Reported Safety Incidents Logged by Severity</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px] font-semibold">Severity</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="text-right font-semibold">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {severities.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Badge variant="outline" className={`font-semibold py-0.5 px-2.5 ${item.badgeColor}`}>
                    {item.level}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm font-normal">
                  {item.description}
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {item.count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
