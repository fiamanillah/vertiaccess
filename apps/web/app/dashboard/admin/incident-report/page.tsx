'use client'

import * as React from 'react'
import { IncidentReportTable } from '@/app/dashboard/admin/incident-report/components/incident-report-table'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import {
  LayoutGrid,
  ListFilter,
  ShieldAlert,
  Siren,
  Search,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Loader2,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import { Card, CardContent } from '@workspace/ui/components/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select'
import { incidentQueryService } from '@/services/incident-query.service'
import type { Ticket } from '@/app/dashboard/components/incident-report/types'
import { toast } from 'sonner'

export default function AdminIncidentQueue() {
  const [search, setSearch] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [sort, setSort] = React.useState('updatedAt')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadIncidents = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await incidentQueryService.listIncidents()
      setTickets(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load incidents')
      toast.error(err?.message || 'Failed to load incidents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadIncidents()
  }, [loadIncidents])

  const sortOptions = [
    { value: 'reference', label: 'Incident ID' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'updatedAt', label: 'Last Updated' },
  ]

  const handleSearch = () => setQuery(search)
  const handleSortOrder = () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')

  const safetyEscalations = tickets.filter(ticket => ticket.priority === 'critical' || ticket.priority === 'high').length
  const pendingReview = tickets.filter(ticket => ticket.status === 'action_required' || ticket.status === 'under_review').length
  const resolvedToday = tickets.filter(ticket => ticket.status === 'resolved').length

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-[1600px] mx-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Incident report
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-border" />
            <span className="text-xs text-muted-foreground">
              {tickets.length} active investigations
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
          <Button onClick={handleSearch} className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
            Search
          </Button>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50/50 border-2 border-red-100 p-5 rounded-2xl flex items-center justify-between group hover:border-red-200 transition-all">
          <div>
            <div className="text-xs font-semibold text-red-700/80 mb-1">
              Safety escalations
            </div>
            <div className="text-3xl font-black text-red-900 leading-none">
              {safetyEscalations}
            </div>
          </div>
          <div className="bg-red-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <Siren className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <div className="bg-amber-50/50 border-2 border-amber-100 p-5 rounded-2xl flex items-center justify-between group hover:border-amber-200 transition-all">
          <div>
            <div className="text-xs font-semibold text-amber-700/80 mb-1">
              Pending review
            </div>
            <div className="text-3xl font-black text-amber-900 leading-none">
              {pendingReview}
            </div>
          </div>
          <div className="bg-amber-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <ListFilter className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <div className="bg-indigo-50/50 border-2 border-indigo-100 p-5 rounded-2xl flex items-center justify-between group hover:border-indigo-200 transition-all">
          <div>
            <div className="text-xs font-semibold text-indigo-700/80 mb-1">
              Avg. incident time
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
            <div className="text-xs font-semibold text-emerald-700/80 mb-1">
              Resolved today
            </div>
            <div className="text-3xl font-black text-emerald-900 leading-none">
              {resolvedToday}
            </div>
          </div>
          <div className="bg-emerald-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <ShieldAlert className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
      </div>

      <IncidentReportTable
        data={tickets}
        isLoading={isLoading}
        baseUrl="/dashboard/admin/incident-report"
        isAdmin={true}
        searchQuery={query}
        sortQuery={sort}
        sortOrder={sortOrder}
      />
    </div>
  )
}
