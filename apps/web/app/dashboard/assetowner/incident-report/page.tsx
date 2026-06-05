'use client'

import * as React from 'react'
import { IncidentReportTable } from './components/incident-report-table'
import { incidentQueryService } from '@/services/incident-query.service'
import type { Ticket } from '@/app/dashboard/components/incident-report/types'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@workspace/ui/components/card'

export default function AssetOwnerIncidentReport() {
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)

    incidentQueryService
      .listMyIncidents()
      .then(data => {
        if (!active) return
        setTickets(data)
      })
      .catch((err: any) => {
        if (!active) return
        setError(err?.message || 'Failed to load incidents')
      })
      .finally(() => {
        if (!active) return
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incident report</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Official safety investigations
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            {error}
          </CardContent>
        </Card>
      )}

      <IncidentReportTable
        data={tickets}
        isLoading={isLoading}
        baseUrl="/dashboard/assetowner/incident-report"
      />
    </div>
  )
}
