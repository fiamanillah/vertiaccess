'use client';

import * as React from 'react';
import { ResolutionTable } from './components/resolution-table';
import { Ticket } from '@/app/dashboard/components/resolution/types';

const mockTickets: Ticket[] = [
    {
        id: '1',
        reference: 'INC-2045',
        bookingRef: 'VA-BKG-E44R9B11',
        status: 'action_required',
        category: 'payment_dispute',
        description: 'Operator declared non-usage for an emergency standby, but site CCTV shows a drone landing and personnel on site for 20 minutes.',
        disputedAmount: 150.00,
        siteName: 'Manchester City Vertiport',
        siteId: 'site-2',
        operatorName: 'Skyline Inspections Ltd',
        landownerName: 'Manchester Aviation Group',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        updatedAt: new Date().toISOString(),
        thread: [
            {
                id: 'm1',
                type: 'message',
                sender: 'admin',
                senderName: 'Admin',
                content: 'Thank you for providing the CCTV snapshots. We are investigating the flight logs and will reach out to the operator for clarification.',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
            }
        ]
    }
];

export default function LandownerResolutionCenter() {
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
                baseUrl="/dashboard/landowner/resolution" 
            />
        </div>
    );
}
