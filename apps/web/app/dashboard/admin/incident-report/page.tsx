'use client'

import * as React from 'react'
import { IncidentReportTable } from '@/app/dashboard/admin/incident-report/components/incident-report-table'
import { Ticket } from '@/app/dashboard/components/incident-report/types'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import {
  LayoutGrid,
  ListFilter,
  ShieldAlert,
  Siren,
  Search,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

const mockAdminTickets: Ticket[] = [
  {
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
    thread: [],
  },
  {
    id: '2',
    reference: 'INC-2045',
    bookingRef: 'VA-BKG-E44R9B11',
    status: 'under_review',
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
    thread: [],
  },
]

export default function AdminIncidentQueue() {
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState('updatedAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  const sortOptions = [
    { value: 'reference', label: 'Incident ID' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'updatedAt', label: 'Last Updated' },
  ];

  const handleSearch = () => setQuery(search);
  const handleSortOrder = () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-[1600px] mx-auto h-full">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground">
            Incident Report
          </h1>
          <div className="flex items-center gap-2">

            <div className="h-1 w-1 rounded-full bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {mockAdminTickets.length} active investigations
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Select onValueChange={setSort} value={sort}>
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSortOrder} size="icon" variant="outline" className="h-10 w-10" title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}>
              {sortOrder === 'asc' ? <ArrowUpNarrowWide size={18} /> : <ArrowDownNarrowWide size={18} />}
            </Button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search incidents..."
              className="pl-9 h-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
            Search
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50/50 border-2 border-red-100 p-5 rounded-2xl flex items-center justify-between group hover:border-red-200 transition-all">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-red-700/60 mb-1">
              Safety Escalations
            </div>
            <div className="text-3xl font-black text-red-900 leading-none">
              04
            </div>
          </div>
          <div className="bg-red-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <Siren className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <div className="bg-amber-50/50 border-2 border-amber-100 p-5 rounded-2xl flex items-center justify-between group hover:border-amber-200 transition-all">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-700/60 mb-1">
              Pending Review
            </div>
            <div className="text-3xl font-black text-amber-900 leading-none">
              12
            </div>
          </div>
          <div className="bg-amber-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <ListFilter className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <div className="bg-indigo-50/50 border-2 border-indigo-100 p-5 rounded-2xl flex items-center justify-between group hover:border-indigo-200 transition-all">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-700/60 mb-1">
              Avg. Incident Time
            </div>
            <div className="text-3xl font-black text-indigo-900 leading-none">
              4.2h
            </div>
          </div>
          <div className="bg-indigo-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <LayoutGrid className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
        <div className="bg-emerald-50/50 border-2 border-emerald-100 p-5 rounded-2xl flex items-center justify-between group hover:border-emerald-200 transition-all">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700/60 mb-1">
              Resolved Today
            </div>
            <div className="text-3xl font-black text-emerald-900 leading-none">
              08
            </div>
          </div>
          <div className="bg-emerald-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <ShieldAlert className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
      </div>


      <IncidentReportTable
        data={mockAdminTickets}
        isLoading={false}
        baseUrl="/dashboard/admin/incident-report"
        isAdmin={true}
        searchQuery={query}
        sortQuery={sort}
        sortOrder={sortOrder}
      />

    </div>
  )
}
