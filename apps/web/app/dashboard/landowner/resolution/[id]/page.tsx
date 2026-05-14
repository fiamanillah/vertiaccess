'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { CaseDetailView } from '../../../operator/resolution/components/case-file/case-detail-view'
import { Ticket } from '../../../../../components/resolution/types'

// In a real app, this would be a fetch call
const getMockTicket = (id: string): Ticket => ({
  id: '1',
  reference: 'INC-2045',
  bookingRef: 'VA-BKG-E44R9B11',
  status: 'action_required',
  priority: 'high',
  category: 'payment_dispute',
  description:
    'Operator declared non-usage for an emergency standby, but site CCTV shows a drone landing and personnel on site for 20 minutes.',
  disputedAmount: 150.0,
  siteName: 'Manchester City Vertiport',
  siteId: 'site-2',
  operatorName: 'Skyline Inspections Ltd',
  landownerName: 'Manchester Aviation Group',
  reporterId: 'lo-2',
  targetId: 'op-2',
  createdAt: new Date(Date.now() - 43200000).toISOString(),
  updatedAt: new Date().toISOString(),
  thread: [
    {
      id: 'm1',
      type: 'message',
      sender: 'admin',
      senderName: 'Admin',
      content:
        'Thank you for providing the CCTV snapshots. We are investigating the flight logs and will reach out to the operator for clarification.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      visibility: 'target',
    },
  ],
})

export default function LandownerCasePage() {
  const params = useParams()
  const ticket = getMockTicket(params.id as string)

  return (
    <CaseDetailView ticket={ticket} backUrl="/dashboard/landowner/resolution" />
  )
}
