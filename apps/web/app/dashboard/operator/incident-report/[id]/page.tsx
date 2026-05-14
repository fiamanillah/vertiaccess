'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { CaseDetailView } from '../components/case-file/case-detail-view'
import { Ticket } from '@/app/dashboard/components/incident-report/types'

// In a real app, this would be a fetch call
const getMockTicket = (id: string): Ticket => ({
  id: '1',
  reference: 'INC-1042',
  bookingRef: 'VA-BKG-X87K2P19',
  status: 'action_required',
  priority: 'critical',
  category: 'unsafe_site_conditions',
  description:
    'Landing area was obstructed by construction equipment not disclosed in the site profile. Had to perform a manual override to avoid collision.',
  disputedAmount: 125.0,
  siteName: 'Canary Wharf Helipad',
  siteId: 'site-1',
  operatorName: 'David Chen',
  landownerName: 'Global Real Estate Group',
  reporterId: 'op-1',
  targetId: 'lo-1',
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
  thread: [
    {
      id: 'm1',
      type: 'message',
      sender: 'admin',
      senderName: 'Admin',
      content:
        'Hello David, we have received your report regarding the obstruction. Can you please confirm if there were any damage to the drone or site property?',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      visibility: 'reporter',
    },
    {
      id: 'm2',
      type: 'message',
      sender: 'user',
      senderName: 'David Chen',
      content:
        'No damage to the drone, but it was a close call. I have attached a photo of the obstruction.',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      visibility: 'reporter',
      attachments: ['evidence_1.png'],
    },
  ],
})

export default function OperatorCasePage() {
  const params = useParams()
  const ticket = getMockTicket(params.id as string)

  return (
    <CaseDetailView ticket={ticket} backUrl="/dashboard/operator/incident-report" />
  )
}
