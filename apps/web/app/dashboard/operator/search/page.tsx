'use client'

import * as React from 'react'
import { SearchHeader } from './components/search-header'
import { ListView } from './components/list-view'
import { GridView } from './components/grid-view'
import { MapView } from './components/map-view'
import { siteService } from '@/services/site.service'
import { DEFAULT_CENTER } from '@/components/map/map-types'
import { Loader2, Search, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@workspace/ui/components/pagination'
import { Skeleton } from '@workspace/ui/components/skeleton'

function SearchGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-background/80 p-0 space-y-0.5">
          <Skeleton className="aspect-[4/3] w-full rounded-t-2xl rounded-b-none" />
          <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4.5 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-3.5 w-16 rounded" />
              <Skeleton className="h-3.5 w-12 rounded" />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border/40">
              <div className="space-y-1">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-2.5 w-8 rounded" />
              </div>
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchListSkeleton() {
  return (
    <div className="space-y-3 max-w-4xl mx-auto w-full">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-2xl border border-border/40 bg-background/80">
          <Skeleton className="h-20 w-28 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-3.5 w-1/2 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
          </div>
          <div className="text-right space-y-2 shrink-0">
            <Skeleton className="h-5 w-16 rounded ml-auto" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchMapSkeleton() {
  return (
    <div className="w-full min-h-[600px] rounded-2xl overflow-hidden border border-border/40 shadow-sm flex-1 relative bg-muted/10">
      <Skeleton className="absolute inset-0 w-full h-full" />
    </div>
  )
}

export default function SearchAndDiscoveryPage() {
  const [viewMode, setViewMode] = React.useState<'list' | 'grid' | 'map'>('grid')
  
  const [filters, setFilters] = React.useState({
    q: '',
    radius: '10',
    siteType: 'all',
    autoApprove: 'all',
    maxPrice: '200',
    lat: '',
    lng: ''
  })
  
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 12
  })
  
  const [sites, setSites] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [totalPages, setTotalPages] = React.useState(1)

  const handleFilterChange = React.useCallback((updates: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on filter change
  }, [])

  React.useEffect(() => {
    let active = true

    const fetchSites = async () => {
      setIsLoading(true)
      try {
        const response = await siteService.searchPublicSites({
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        })

        if (active && response.success) {
          setSites(response.data)
          setTotalPages(response.meta.pagination.totalPages || 1)
        }
      } catch (err: any) {
        if (active) {
          toast.error(err.message || 'Failed to load sites')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    fetchSites()

    return () => {
      active = false
    }
  }, [filters, pagination.page, pagination.limit])

  return (
    <div className="flex flex-col flex-1 relative w-full h-full max-w-7xl mx-auto space-y-4 p-4">
      <SearchHeader
        viewMode={viewMode}
        onViewChange={setViewMode}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <div className="flex-1 w-full h-full flex flex-col pt-2 animate-in fade-in zoom-in-95 duration-200">
        {isLoading ? (
          viewMode === 'grid' ? (
            <SearchGridSkeleton />
          ) : viewMode === 'list' ? (
            <SearchListSkeleton />
          ) : (
            <SearchMapSkeleton />
          )
        ) : sites.length === 0 ? (
          <div className="flex flex-1 flex-col gap-2 items-center justify-center min-h-[400px] text-muted-foreground">
            <Search className="h-12 w-12 opacity-20" />
            <p>No sites found matching your criteria.</p>
          </div>
        ) : (
          <>
            {viewMode === 'list' && (
              <div className="max-w-4xl mx-auto w-full">
                <ListView sites={sites} />
              </div>
            )}
            {viewMode === 'grid' && (
              <div className="w-full">
                <GridView sites={sites} />
              </div>
            )}
            {viewMode === 'map' && (
              <div className="w-full min-h-[600px] rounded-2xl overflow-hidden border border-border/40 shadow-sm flex-1">
                <MapView 
                  sites={sites} 
                  center={filters.lat && filters.lng ? { lat: parseFloat(filters.lat), lng: parseFloat(filters.lng) } : DEFAULT_CENTER}
                />
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 pb-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                        className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                              isActive={pagination.page === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      }
                      if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPagination(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
                        className={pagination.page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
