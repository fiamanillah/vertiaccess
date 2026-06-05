'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PreviewMap } from '@/components/map/preview-map'
import { RejectionModal } from '../../components/rejection-modal'
import { bookingService } from '@/services/booking.service'
import { Booking } from '../../types'
import { circleAreaM2, polygonAreaM2, formatArea } from '@/lib/geojson-utils'
import {
  toGeometryMode,
  toGeometryCenter,
  toPolygonPoints,
} from './components/review-geometry-utils'
import { ReviewSkeleton } from './components/review-skeleton'
import { ReviewHeader } from './components/review-header'
import {
  RequestDetailsSection,
  AssetInformationSection,
  AssetGeometrySection,
  OperationWindowSection,
  AircraftInfoSection,
  OperatorInfoSection,
  CommercialSummarySection,
} from './components/review-detail-sections'
import { ReviewActionFooter } from './components/review-action-footer'
import { PaymentIssueDialog } from './components/payment-issue-dialog'

// ─── Main Review Page Component ──────────────────────────────────────────────

export default function AssetOwnerOperationReviewPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const [booking, setBooking] = React.useState<Booking | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isActionSubmitting, setIsActionSubmitting] = React.useState(false)
  const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false)
  const [isPaymentIssueModalOpen, setIsPaymentIssueModalOpen] =
    React.useState(false)

  const loadBooking = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const data = await bookingService.getBooking(id)
      setBooking(data)
    } catch (err) {
      console.error('Failed to load booking details', err)
      toast.error('Failed to load access request details')
      router.push('/dashboard/assetowner/scheduler')
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  React.useEffect(() => {
    void loadBooking()
  }, [loadBooking])

  // Approve action
  const handleApprove = async () => {
    if (!booking) return
    setIsActionSubmitting(true)
    try {
      await bookingService.updateBookingStatus(booking.id, 'APPROVED')
      toast.success('Operation approved successfully')
      router.push('/dashboard/assetowner/scheduler')
    } catch (value) {
      const msg =
        value instanceof Error ? value.message : 'Failed to approve booking'
      const isPaymentError =
        msg.toLowerCase().includes('payment') ||
        msg.toLowerCase().includes('card') ||
        msg.toLowerCase().includes('payment method') ||
        (value &&
          typeof value === 'object' &&
          'code' in value &&
          (value as any).code === 'APPROVAL_PAYMENT_FAILED')

      if (isPaymentError) {
        setIsPaymentIssueModalOpen(true)
        void loadBooking()
      } else {
        toast.error(msg)
      }
    } finally {
      setIsActionSubmitting(false)
    }
  }

  // Reject action
  const handleRejectClick = () => {
    setIsRejectionModalOpen(true)
  }

  const handleConfirmReject = async (reason: string) => {
    if (!booking) return
    setIsActionSubmitting(true)
    try {
      await bookingService.updateBookingStatus(booking.id, 'REJECTED', reason)
      toast.info('Operation declined.')
      setIsRejectionModalOpen(false)
      router.push('/dashboard/assetowner/scheduler')
    } catch (value) {
      toast.error(
        value instanceof Error ? value.message : 'Failed to decline booking',
      )
    } finally {
      setIsActionSubmitting(false)
    }
  }

  // Loading Skeleton
  if (isLoading) {
    return <ReviewSkeleton />
  }

  if (!booking) return null

  // Geometry calculations for map
  const showToal =
    booking.useCategory === 'planned_toal' ||
    (booking.useCategory as string) === 'both' ||
    !booking.useCategory
  const showEmergency =
    (booking.useCategory === 'emergency_recovery' ||
      (booking.useCategory as string) === 'both' ||
      !booking.useCategory) &&
    Boolean(booking.siteClzGeometry)

  const mapCenter = toGeometryCenter(
    booking.useCategory === 'emergency_recovery' && booking.siteClzGeometry
      ? booking.siteClzGeometry
      : booking.siteGeometry,
  )
  const toalMode = toGeometryMode(booking.siteGeometry)
  const toalPoints = toPolygonPoints(booking.siteGeometry)
  const emergencyMode = toGeometryMode(booking.siteClzGeometry)
  const emergencyPoints = toPolygonPoints(booking.siteClzGeometry)
  const toalRadius = (booking.siteGeometry as any)?.radius ?? 100
  const emergencyRadius = (booking.siteClzGeometry as any)?.radius ?? 0

  const computedToalArea =
    toalMode === 'polygon'
      ? formatArea(polygonAreaM2(toalPoints))
      : formatArea(circleAreaM2(toalRadius))

  const computedEmergencyArea =
    emergencyMode === 'polygon'
      ? formatArea(polygonAreaM2(emergencyPoints))
      : formatArea(circleAreaM2(emergencyRadius))

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] w-full animate-fade-in">
      <ReviewHeader booking={booking} />

      <style>{`
        .review-map-container .leaflet-container {
          height: 100% !important;
          min-height: 100% !important;
          border-radius: 0px !important;
        }
        .review-map-container > div {
          height: 100% !important;
          min-height: 100% !important;
          border: none !important;
          border-radius: 0px !important;
          box-shadow: none !important;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden min-h-0 w-full">
        <div className="w-full lg:w-[60%] h-[350px] lg:h-full relative review-map-container shrink-0 bg-muted/20">
          <PreviewMap
            center={mapCenter}
            toalRadius={toalRadius}
            emergencyRadius={emergencyRadius}
            showEmergency={showEmergency}
            showToal={showToal}
            toalMode={toalMode}
            emergencyMode={emergencyMode}
            initialToalPolygonPoints={toalPoints}
            initialEmergencyPolygonPoints={emergencyPoints}
            className="w-full h-full"
          />
        </div>

        <div className="w-full lg:w-[40%] h-auto lg:h-full flex flex-col border-t lg:border-t-0 lg:border-l border-border/40 bg-background min-h-0 shrink-0 lg:shrink">
          <div className="px-4.5 py-3 border-b border-border/40 bg-muted/10 shrink-0">
            <div className="text-sm font-semibold text-muted-foreground">
              Infrastructure
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
              Access Request Details
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4.5 space-y-4 custom-scrollbar text-foreground">
            <RequestDetailsSection booking={booking} />
            <AssetInformationSection booking={booking} />
            <AssetGeometrySection
              showToal={showToal}
              showEmergency={showEmergency}
              toalMode={toalMode}
              toalPoints={toalPoints}
              emergencyMode={emergencyMode}
              emergencyPoints={emergencyPoints}
              toalRadius={toalRadius}
              emergencyRadius={emergencyRadius}
              computedToalArea={computedToalArea}
              computedEmergencyArea={computedEmergencyArea}
            />
            <OperationWindowSection booking={booking} />
            <AircraftInfoSection booking={booking} />
            <OperatorInfoSection booking={booking} />
            <CommercialSummarySection booking={booking} />
          </div>

          <ReviewActionFooter
            booking={booking}
            isActionSubmitting={isActionSubmitting}
            onApprove={handleApprove}
            onReject={handleRejectClick}
          />
        </div>
      </div>

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={handleConfirmReject}
        isSubmitting={isActionSubmitting}
      />

      <PaymentIssueDialog
        open={isPaymentIssueModalOpen}
        onOpenChange={setIsPaymentIssueModalOpen}
        onWaitAndTryLater={() => setIsPaymentIssueModalOpen(false)}
        onDeclineRequest={() => {
          setIsPaymentIssueModalOpen(false)
          setIsRejectionModalOpen(true)
        }}
      />
    </div>
  )
}
