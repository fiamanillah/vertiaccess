'use client'

import * as React from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Badge } from '@workspace/ui/components/badge'
import {
  adminService,
  type SiteVerificationRequest,
} from '@/services/admin.service'
import { toast } from 'sonner'
import { Loader2, RefreshCcw, Search } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { NeedsReviewTable } from './components/needs-review-table'
import { ApprovedSitesTable } from './components/approved-sites-table'
import { RejectedSitesTable } from './components/rejected-sites-table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@workspace/ui/components/pagination'

export default function AdminSitesVerificationPage() {
  const [verifications, setVerifications] = React.useState<
    SiteVerificationRequest[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('needs-review')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize] = React.useState(10)
  const [totalPages, setTotalPages] = React.useState(1)
  const [counts, setCounts] = React.useState({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  })

  const [searchQuery, setSearchQuery] = React.useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState('')

  // Debounce search query changes to prevent excessive API hits
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to page 1 on new search query
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery])

  const getStatusFromTab = (tab: string) => {
    switch (tab) {
      case 'needs-review':
        return 'PENDING'
      case 'approved':
        return 'APPROVED'
      case 'rejected':
        return 'REJECTED'
      default:
        return 'PENDING'
    }
  }

  const fetchSiteData = React.useCallback(
    async (status: string, page: number, query: string) => {
      const response = await adminService.listSiteVerifications({
        status,
        page,
        limit: pageSize,
        query: query || undefined,
      })

      if (response.success) {
        return {
          data: response.data,
          pagination: response.meta.pagination,
          counts: response.meta.counts,
        }
      }
      throw new Error('Failed to fetch from service')
    },
    [pageSize],
  )

  React.useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setIsLoading(true) // Instant feedback on tab, page or search transitions!
      try {
        const status = getStatusFromTab(activeTab)
        const result = await fetchSiteData(status, currentPage, debouncedSearchQuery)

        if (isMounted) {
          setVerifications(result.data)
          setTotalPages(result.pagination.totalPages)
          setCounts(result.counts)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch site verifications:', error)
          toast.error('Failed to load verification queue')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [activeTab, currentPage, debouncedSearchQuery, fetchSiteData])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(1)
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const status = getStatusFromTab(activeTab)
      const result = await fetchSiteData(status, currentPage, debouncedSearchQuery)
      setVerifications(result.data)
      setTotalPages(result.pagination.totalPages)
      setCounts(result.counts)
    } catch (error) {
      console.error('Failed to refresh site verifications:', error)
      toast.error('Failed to refresh verification queue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 container mx-auto p-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Site Verification Queue
          </h1>
          <p className="text-muted-foreground">
            Manage and verify landing sites across the network.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="needs-review" className="relative">
              Needs Review
              {counts.PENDING > 0 && (
                <Badge className="ml-2 bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                  {counts.PENDING}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved Sites
              {counts.APPROVED > 0 && (
                <Badge
                  variant="outline"
                  className="ml-2 h-5 min-w-5 px-1 flex items-center justify-center rounded-full text-[10px]"
                >
                  {counts.APPROVED}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              {counts.REJECTED > 0 && (
                <Badge
                  variant="outline"
                  className="ml-2 h-5 min-w-5 px-1 flex items-center justify-center rounded-full text-[10px]"
                >
                  {counts.REJECTED}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </span>
            <input
              type="text"
              placeholder="Search name, ref, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <TabsContent value="needs-review">
          <NeedsReviewTable data={verifications} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="approved">
          <ApprovedSitesTable data={verifications} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="rejected">
          <RejectedSitesTable data={verifications} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={
                    currentPage === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }
                return null
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
