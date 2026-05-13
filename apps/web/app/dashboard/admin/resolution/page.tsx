'use client';

import * as React from 'react';
import { ResolutionTable } from './components/resolution-table';
import { Ticket } from '@/app/dashboard/components/resolution/types';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { 
    Search, 
    Filter, 
    LayoutGrid, 
    ListFilter,
    ShieldAlert,
    Siren
} from 'lucide-react';
import { 
    Tabs, 
    TabsList, 
    TabsTrigger 
} from '@workspace/ui/components/tabs';

const mockAdminTickets: Ticket[] = [
    {
        id: '1',
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
        thread: []
    },
    {
        id: '2',
        reference: 'INC-2045',
        bookingRef: 'VA-BKG-E44R9B11',
        status: 'under_review',
        priority: 'high',
        category: 'payment_dispute',
        description: 'Operator declared non-usage for an emergency standby, but site CCTV shows a drone landing and personnel on site for 20 minutes.',
        disputedAmount: 150.00,
        siteName: 'Manchester City Vertiport',
        siteId: 'site-2',
        operatorName: 'Skyline Inspections Ltd',
        landownerName: 'Manchester Aviation Group',
        reporterId: 'lo-2',
        targetId: 'op-2',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        updatedAt: new Date().toISOString(),
        thread: []
    }
];

export default function AdminResolutionQueue() {
    return (
        <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-[1600px] mx-auto h-full">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground">
                        Incident Command Center
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted px-2 py-1 rounded">Global Queue</span>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{mockAdminTickets.length} active investigations</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-11 px-5 border-2 gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-muted">
                        <Filter className="h-4 w-4" />
                        Advanced Filter
                    </Button>
                    <Button className="h-11 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                        Export Audit Log
                    </Button>
                </div>
            </div>

            {/* Triage Bar */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center bg-card border-2 border-border/50 p-3 rounded-2xl shadow-sm">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input 
                        placeholder="Search by Incident ID, Booking Ref, or User Email..." 
                        className="pl-11 h-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-medium text-sm transition-all"
                    />
                </div>
                
                <Tabs defaultValue="all" className="w-full md:w-auto">
                    <TabsList className="bg-muted/50 p-1 h-12 gap-1 rounded-xl border border-border/50">
                        <TabsTrigger value="all" className="px-5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                            All Tickets
                        </TabsTrigger>
                        <TabsTrigger value="assigned" className="px-5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                            My Queue
                        </TabsTrigger>
                        <TabsTrigger value="unassigned" className="px-5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                            Unassigned
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-red-50/50 border-2 border-red-100 p-5 rounded-2xl flex items-center justify-between group hover:border-red-200 transition-all">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-red-700/60 mb-1">Safety Escalations</div>
                        <div className="text-3xl font-black text-red-900 leading-none">04</div>
                    </div>
                    <div className="bg-red-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <Siren className="h-6 w-6 text-red-600" />
                    </div>
                </div>
                <div className="bg-amber-50/50 border-2 border-amber-100 p-5 rounded-2xl flex items-center justify-between group hover:border-amber-200 transition-all">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-amber-700/60 mb-1">Pending Review</div>
                        <div className="text-3xl font-black text-amber-900 leading-none">12</div>
                    </div>
                    <div className="bg-amber-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <ListFilter className="h-6 w-6 text-amber-600" />
                    </div>
                </div>
                <div className="bg-indigo-50/50 border-2 border-indigo-100 p-5 rounded-2xl flex items-center justify-between group hover:border-indigo-200 transition-all">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-700/60 mb-1">Avg. Resolution</div>
                        <div className="text-3xl font-black text-indigo-900 leading-none">4.2h</div>
                    </div>
                    <div className="bg-indigo-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <LayoutGrid className="h-6 w-6 text-indigo-600" />
                    </div>
                </div>
                <div className="bg-emerald-50/50 border-2 border-emerald-100 p-5 rounded-2xl flex items-center justify-between group hover:border-emerald-200 transition-all">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700/60 mb-1">Resolved Today</div>
                        <div className="text-3xl font-black text-emerald-900 leading-none">08</div>
                    </div>
                    <div className="bg-emerald-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <ShieldAlert className="h-6 w-6 text-emerald-600" />
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <ResolutionTable 
                data={mockAdminTickets} 
                isLoading={false} 
                baseUrl="/dashboard/admin/resolution"
                isAdmin={true}
            />
        </div>
    );
}
