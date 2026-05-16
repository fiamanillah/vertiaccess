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
import { Loader2, RefreshCcw } from 'lucide-react'
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
    async (status: string, page: number) => {
      const response = await adminService.listSiteVerifications({
        status,
        page,
        limit: pageSize,
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

    // REMOVED: setIsLoading(true); is no longer here.

    const loadData = async () => {
      try {
        const status = getStatusFromTab(activeTab)
        const result = await fetchSiteData(status, currentPage)

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
  }, [activeTab, currentPage, fetchSiteData])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(1)
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const status = getStatusFromTab(activeTab)
      const result = await fetchSiteData(status, currentPage)
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
    <div className="flex flex-col gap-8 p-8">
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
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
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
