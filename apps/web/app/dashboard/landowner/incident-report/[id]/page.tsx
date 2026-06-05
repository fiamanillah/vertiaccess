'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { CaseDetailView } from '../../../operator/incident-report/components/case-file/case-detail-view'
import type { Ticket } from '@/app/dashboard/components/incident-report/types'
import { incidentQueryService } from '@/services/incident-query.service'
import { Card, CardContent } from '@workspace/ui/components/card'
import { Loader2 } from 'lucide-react'

export default function LandownerCasePage() {
  const params = useParams<{ id: string }>()
  const [ticket, setTicket] = React.useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)

    incidentQueryService
      .getIncident(params.id)
      .then(data => {
        if (!active) return
        setTicket(data)
      })
      .catch((err: any) => {
        if (!active) return
        setError(err?.message || 'Failed to load incident')
      })
      .finally(() => {
        if (!active) return
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {error || 'Incident not found'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const replyVisibility = ticket.reporterRole === 'landowner' ? 'reporter' : 'target'

  return (
    <CaseDetailView
      ticket={ticket}
      backUrl="/dashboard/landowner/incident-report"
      replyVisibility={replyVisibility}
      onTicketUpdate={setTicket}
    />
  )
}
