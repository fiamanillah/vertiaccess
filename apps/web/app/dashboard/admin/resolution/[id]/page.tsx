'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { TriPaneLayout } from '../components/tri-pane-layout';
import { Ticket } from '@/app/dashboard/components/resolution/types';

// Mock data fetching function
const getMockTicket = (id: string): Ticket => ({
    id,
    reference: 'INC-1042',
    bookingRef: 'VA-BKG-X87K2P19',
    status: 'action_required',
    priority: 'critical',
    category: 'unsafe_site_conditions',
    description: 'Landing area was obstructed by construction equipment not disclosed in the site profile. Had to perform a manual override to avoid collision.',
    disputedAmount: 125.00,
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
            sender: 'user',
            senderName: 'David Chen',
            content: 'The landing zone was completely blocked. I have photos of the equipment.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            visibility: 'reporter',
            attachments: ['evidence_1.png']
        },
        {
            id: 'i1',
            type: 'message',
            sender: 'admin',
            senderName: 'Admin Sarah',
            content: 'Initial assessment: Reporter seems credible. CCTV verification needed.',
            timestamp: new Date(Date.now() - 3400000).toISOString(),
            visibility: 'internal'
        },
        {
            id: 'm2',
            type: 'message',
            sender: 'admin',
            senderName: 'Admin Sarah',
            content: 'Hello Global Real Estate Group, we have received a report of equipment obstructing the Canary Wharf Helipad. Please provide site logs for May 14th.',
            timestamp: new Date(Date.now() - 3200000).toISOString(),
            visibility: 'target'
        },
        {
            id: 'a1',
            type: 'action',
            content: 'Admin requested clarification from landowner',
            timestamp: new Date(Date.now() - 3000000).toISOString()
        }
    ]
});

const mockOtherTickets: Ticket[] = [
    {
        id: '1',
        reference: 'INC-1042',
        bookingRef: 'VA-BKG-X87K2P19',
        status: 'action_required',
        priority: 'critical',
        category: 'unsafe_site_conditions',
        description: '...',
        siteName: 'Canary Wharf Helipad',
        siteId: 'site-1',
        operatorName: 'David Chen',
        landownerName: 'Global Real Estate Group',
        reporterId: 'op-1',
        targetId: 'lo-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thread: []
    },
    {
        id: '2',
        reference: 'INC-2045',
        bookingRef: 'VA-BKG-E44R9B11',
        status: 'under_review',
        priority: 'high',
        category: 'payment_dispute',
        description: '...',
        siteName: 'Manchester City Vertiport',
        siteId: 'site-2',
        operatorName: 'Skyline Inspections Ltd',
        landownerName: 'Manchester Aviation Group',
        reporterId: 'lo-2',
        targetId: 'op-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thread: []
    }
];

export default function AdminCaseDetail() {
    const params = useParams();
    const ticket = getMockTicket(params.id as string);

    return (
        <TriPaneLayout 
            activeTicket={ticket} 
        />
    );
}
