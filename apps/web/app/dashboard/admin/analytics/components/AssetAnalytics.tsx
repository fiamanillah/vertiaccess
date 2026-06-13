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
import { RadialProgress } from './SimpleChart'

interface AssetNetworkData {
  totalAssets: number
  assetsUsedThisMonth: number
  utilisationRate: number
}

interface AssetCapabilityData {
  toal: number
  emergencyAndRecovery: number
}

interface TopAssetItem {
  name: string
  requests: number
}

interface AssetAnalyticsProps {
  network: AssetNetworkData
  capability: AssetCapabilityData
  topAssets: TopAssetItem[]
}

export default function AssetAnalytics({
  network,
  capability,
  topAssets,
}: AssetAnalyticsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Network Utilisation & Capability */}
      <div className="space-y-6">
        <Card className="border-muted/60">
          <CardHeader>
            <CardTitle className="tracking-tight text-lg">Asset Network Analytics</CardTitle>
            <CardDescription>
              Utilization Rate of Platform Infrastructure
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <RadialProgress
                value={network.utilisationRate}
                size={130}
                color="#3b82f6"
              />
            </div>
            <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Assets</span>
                <span className="text-sm font-bold">{network.totalAssets}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm font-medium text-muted-foreground">Assets Used This Month</span>
                <span className="text-sm font-bold">{network.assetsUsedThisMonth}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-sm font-medium text-muted-foreground">Utilization Rate</span>
                <span className="text-sm font-bold text-blue-600">{network.utilisationRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted/60">
          <CardHeader>
            <CardTitle className="tracking-tight text-lg">Asset Capability Analytics</CardTitle>
            <CardDescription>Requests by Landing Zone Classification</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Capability</TableHead>
                  <TableHead className="text-right font-semibold">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">TOAL</TableCell>
                  <TableCell className="text-right">{capability.toal}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Emergency and Recovery</TableCell>
                  <TableCell className="text-right">{capability.emergencyAndRecovery}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Top Assets */}
      <Card className="border-muted/60">
        <CardHeader>
          <CardTitle className="tracking-tight text-lg">Top 10 Best Assets</CardTitle>
          <CardDescription>Most Requested Sites Across the Network</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] font-semibold">Rank</TableHead>
                <TableHead className="font-semibold">Asset Name</TableHead>
                <TableHead className="text-right font-semibold">Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topAssets.length > 0 ? (
                topAssets.map((asset, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-muted-foreground font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="text-right font-bold">{asset.requests}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">
                    No Asset Data Available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
