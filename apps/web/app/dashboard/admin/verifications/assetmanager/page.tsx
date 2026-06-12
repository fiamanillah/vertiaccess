'use client'

import * as React from 'react'
import { Tabs, TabsContent } from '@workspace/ui/components/tabs'
import { adminService, type VerificationRequest } from '@/services/admin.service'
import { toast } from 'sonner'
import { QueueHeader } from './_components/QueueHeader'
import { QueueTabs } from './_components/QueueTabs'
import { NeedsReviewTable } from './_components/Tables/NeedsReviewTable'
import { ApprovedTable } from './_components/Tables/ApprovedTable'
import { RejectedTable } from './_components/Tables/RejectedTable'

export default function AssetManagerVerificationsPage() {
  const [verifications, setVerifications] = React.useState<VerificationRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('needs-review')
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [totalPages, setTotalPages] = React.useState(1)
  const [counts, setCounts] = React.useState({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  })

  // Map tab values to API status strings
  const getStatusFromTab = React.useCallback((tab: string) => {
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
  }, [])

  // 1. Pure data fetching logic
  const fetchAssetManagerData = React.useCallback(
    async (status: string, pageIndex: number, pageSize: number) => {
      const response = await adminService.listUserVerifications({
        status,
        role: 'assetmanager',
        page: pageIndex + 1,
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
    [],
  )

  // Load data when activeTab, pageIndex, or pageSize changes
  React.useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const status = getStatusFromTab(activeTab)
        const result = await fetchAssetManagerData(
          status,
          pagination.pageIndex,
          pagination.pageSize,
        )

        if (isMounted) {
          setVerifications(result.data)
          setTotalPages(result.pagination.totalPages)
          setCounts(result.counts)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch verifications:', error)
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
  }, [activeTab, pagination.pageIndex, pagination.pageSize, fetchAssetManagerData, getStatusFromTab])

  // Reset page index when switching tabs
  const handleTabChange = (value: string) => {
    setIsLoading(true)
    setActiveTab(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  // Trigger loading & refresh
  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const status = getStatusFromTab(activeTab)
      const result = await fetchAssetManagerData(
        status,
        pagination.pageIndex,
        pagination.pageSize,
      )
      setVerifications(result.data)
      setTotalPages(result.pagination.totalPages)
      setCounts(result.counts)
      toast.success('Queue refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh verifications:', error)
      toast.error('Failed to refresh verification queue')
    } finally {
      setIsLoading(false)
    }
  }

  const currentStatus = getStatusFromTab(activeTab) as keyof typeof counts
  const totalRows = counts[currentStatus] || 0

  return (
    <div className="flex flex-col gap-8 container mx-auto p-4">
      <QueueHeader isLoading={isLoading} onRefresh={handleRefresh} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <QueueTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={counts}
          isLoading={isLoading}
        />

        <TabsContent value="needs-review" className="outline-none">
          <NeedsReviewTable
            data={verifications}
            isLoading={isLoading}
            totalPages={totalPages}
            totalRows={totalRows}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </TabsContent>

        <TabsContent value="approved" className="outline-none">
          <ApprovedTable
            data={verifications}
            isLoading={isLoading}
            totalPages={totalPages}
            totalRows={totalRows}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </TabsContent>

        <TabsContent value="rejected" className="outline-none">
          <RejectedTable
            data={verifications}
            isLoading={isLoading}
            totalPages={totalPages}
            totalRows={totalRows}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
