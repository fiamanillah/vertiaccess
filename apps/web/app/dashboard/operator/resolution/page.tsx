'use client';

import * as React from 'react';
import { ResolutionTable } from './components/resolution-table';
import { Ticket } from '@/app/dashboard/components/resolution/types';

const mockTickets: Ticket[] = [
    {
        id: '1',
        reference: 'INC-1042',
        bookingRef: 'VA-BKG-X87K2P19',
        status: 'action_required',
        category: 'unsafe_site_conditions',
        description: 'Landing area was obstructed by construction equipment not disclosed in the site profile. Had to perform a manual override to avoid collision.',
        disputedAmount: 125.00,
        siteName: 'Canary Wharf Helipad',
        siteId: 'site-1',
        operatorName: 'David Chen',
        landownerName: 'Global Real Estate Group',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        thread: [
            {
                id: 'm1',
                type: 'message',
                sender: 'admin',
                senderName: 'Admin',
                content: 'Hello David, we have received your report regarding the obstruction. Can you please confirm if there were any damage to the drone or site property?',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
            },
            {
                id: 'a1',
                type: 'action',
                content: 'Admin requested flight logs from operator',
                timestamp: new Date(Date.now() - 3000000).toISOString(),
            },
            {
                id: 'm2',
                type: 'message',
                sender: 'user',
                senderName: 'David Chen',
                content: 'No damage to the drone, but it was a close call. I have attached a photo of the obstruction.',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                attachments: ['evidence_1.png']
            }
        ]
    }
];

export default function OperatorResolutionCenter() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Resolution Center</h1>
                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest mt-1">
                        Official Safety & Billing Investigations
                    </p>
                </div>
            </div>

            <ResolutionTable 
                data={mockTickets} 
                isLoading={false} 
                baseUrl="/dashboard/operator/resolution" 
            />
        </div>
    );
}
