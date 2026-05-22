'use client'

import * as React from 'react'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Progress } from '@workspace/ui/components/progress'
import {
  ChevronLeft,
  Clock,
  Zap,
  CheckCircle2,
  Link as LinkIcon,
} from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog'
import { StepOperationType } from './step-operation-type'
import { StepSchedule } from './step-schedule'
import { StepMissionDetails } from './step-mission-details'
import { StepCheckout } from './step-checkout'
import { MissionData, OperationType } from './types'
import { bookingService } from '@/services/booking.service'
import type { Booking } from '@/services/booking.types'
import type { BookingCheckoutContext } from '@/services/booking.types'
import { AddCardModal } from '@/app/dashboard/operator/billing/components/add-card-modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface BookingEngineCardProps {
  site: any
}

/** Combines a Date with an "HH:mm" string into a full UTC ISO timestamp */
function combineDateAndTime(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const dt = new Date(date)
  dt.setUTCHours(h ?? 0, m ?? 0, 0, 0)
  return dt.toISOString()
}

export function BookingEngineCard({ site }: BookingEngineCardProps) {
  const router = useRouter()

  const [step, setStep] = React.useState(1)
  const [operationType, setOperationType] =
    React.useState<OperationType>('toal')
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    undefined,
  )
  const [selectedStartTime, setSelectedStartTime] = React.useState<
    string | undefined
  >(undefined)
  const [selectedEndTime, setSelectedEndTime] = React.useState<
    string | undefined
  >(undefined)
  const [missionData, setMissionData] = React.useState<MissionData>({
    droneModel: '',
    weightClass: '',
    missionIntent: '',
    flyerId: '',
    operatorId: '',
  })
  const [emergencyAuthAgreed, setEmergencyAuthAgreed] = React.useState(false)
  const [checkoutContext, setCheckoutContext] =
    React.useState<BookingCheckoutContext | null>(null)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = React.useState<
    string | null
  >(null)
  const [isCheckoutLoading, setIsCheckoutLoading] = React.useState(true)
  const [billingError, setBillingError] = React.useState<string | null>(null)
  const [isAddCardOpen, setIsAddCardOpen] = React.useState(false)
  const [showConfirmation, setShowConfirmation] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [createdBooking, setCreatedBooking] = React.useState<Booking | null>(
    null,
  )

  const nextStep = () => setStep((s) => Math.min(s + 1, 4))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))
  const progressValue = (step / 4) * 100

  const isAuto = site.autoApprove === true
  const toalFee = site.toalAccessFee || 0
  const emergencyFee = site.clzAccessFee || 0
  const currentFee = operationType === 'toal' ? toalFee : emergencyFee
  const isEmergency = operationType === 'emergency'
  const canBookToal = site.siteType !== 'emergency' || toalFee > 0
  const canBookEmergency = Boolean(
    site.clzEnabled || site.siteType === 'emergency' || emergencyFee > 0,
  )
  const hasActiveSubscription = Boolean(
    checkoutContext?.subscription.hasActiveSubscription,
  )
  const billingTotalToday =
    checkoutContext?.pricing.totalDueNow ??
    (operationType === 'toal'
      ? currentFee + (hasActiveSubscription ? 0 : 5)
      : 0)
  const resolvedPaymentMethodId =
    selectedPaymentMethodId ??
    checkoutContext?.defaultPaymentMethodId ??
    checkoutContext?.paymentMethods[0]?.id ??
    null

  React.useEffect(() => {
    let active = true
    setIsCheckoutLoading(true)
    setBillingError(null)

    bookingService
      .getCheckoutContext(
        site.id,
        operationType === 'emergency' ? 'emergency_recovery' : 'planned_toal',
      )
      .then((context) => {
        if (!active) return
        setCheckoutContext(context)
      })
      .catch((error: any) => {
        if (!active) return
        setCheckoutContext(null)
        setBillingError(error?.message ?? 'Failed to load billing details')
      })
      .finally(() => {
        if (active) {
          setIsCheckoutLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [site.id, operationType])

  React.useEffect(() => {
    if (!checkoutContext) return

    setSelectedPaymentMethodId((current) => {
      if (
        current &&
        checkoutContext.paymentMethods.some((method) => method.id === current)
      ) {
        return current
      }

      return (
        checkoutContext.defaultPaymentMethodId ??
        checkoutContext.paymentMethods[0]?.id ??
        null
      )
    })
  }, [checkoutContext])

  React.useEffect(() => {
    if (!canBookToal && canBookEmergency && operationType !== 'emergency') {
      setOperationType('emergency')
    }
    if (!canBookEmergency && canBookToal && operationType !== 'toal') {
      setOperationType('toal')
    }
  }, [canBookEmergency, canBookToal, operationType])

  const isNextDisabled = () => {
    if (step === 1) {
      const currentChoiceValid =
        (operationType === 'toal' && canBookToal) ||
        (operationType === 'emergency' && canBookEmergency)

      return !currentChoiceValid
    }
    if (step === 2)
      return !selectedDate || !selectedStartTime || !selectedEndTime
    if (step === 3) {
      return (
        !missionData.droneModel ||
        !missionData.weightClass ||
        !missionData.missionIntent ||
        !missionData.flyerId ||
        !missionData.operatorId
      )
    }
    // Step 4: emergency requires auth checkbox
    if (step === 4) {
      if (isCheckoutLoading || billingError) return true
      if (checkoutContext?.requiresCard && !resolvedPaymentMethodId) return true
      if (isEmergency && !emergencyAuthAgreed) return true
    }
    return false
  }

  // Only show the step 1 loading label while checkout data is still loading
  const isStep1Loading = step === 1 && isCheckoutLoading

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) return
    if (checkoutContext?.requiresCard && !resolvedPaymentMethodId) {
      toast.error('Please add or select a payment card before booking.')
      return
    }
    setIsLoading(true)

    try {
      const startISO = combineDateAndTime(selectedDate, selectedStartTime)
      const endISO = combineDateAndTime(selectedDate, selectedEndTime)
      const paymentMethodId = resolvedPaymentMethodId ?? undefined

      const booking = await bookingService.createBooking({
        siteId: site.id,
        startTime: startISO,
        endTime: endISO,
        droneModel: missionData.droneModel,
        missionIntent: missionData.missionIntent,
        billingMode:
          checkoutContext?.pricing.billingMode ??
          (hasActiveSubscription ? 'subscription' : 'payg'),
        useCategory: isEmergency ? 'emergency_recovery' : 'planned_toal',
        operationReference: missionData.operationReference,
        flyerId: missionData.flyerId,
        paymentMethodId,
        ...(isEmergency && { emergencyAuthAgreed: true }),
      })

      setCreatedBooking(booking)
      setShowConfirmation(true)
    } catch (err: any) {
      toast.error(err?.message ?? 'Booking failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setShowConfirmation(false)
    setStep(1)
    setCreatedBooking(null)
    setEmergencyAuthAgreed(false)
  }

  const handleViewBookings = () => {
    router.push('/dashboard/operator/bookings')
  }

  const handleAddCardSuccess = async () => {
    setIsAddCardOpen(false)
    setIsCheckoutLoading(true)
    setBillingError(null)

    try {
      const context = await bookingService.getCheckoutContext(
        site.id,
        operationType === 'emergency' ? 'emergency_recovery' : 'planned_toal',
      )
      setCheckoutContext(context)
    } catch (error: any) {
      setCheckoutContext(null)
      setBillingError(error?.message ?? 'Failed to load billing details')
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  return (
    <Card className="sticky top-24 shadow-2xl border-primary/10 overflow-hidden bg-background/80 backdrop-blur-md max-h-[calc(100vh-8rem)] flex flex-col">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <Progress
          value={progressValue}
          className="h-1 rounded-none bg-primary/10"
        />
      </div>

      <CardHeader className="pb-3 pt-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">
            Step {step} of 4
          </span>
          {step > 1 && (
            <Button
              variant="ghost"
              size="xs"
              className="h-6 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground"
              onClick={prevStep}
            >
              <ChevronLeft className="mr-1 h-3 w-3" />
              Back
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {isAuto ? (
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 text-[10px] py-0 px-2 font-bold"
              >
                <Zap className="h-3 w-3 fill-current" />
                AUTO-APPROVAL
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 text-[10px] py-0 px-2 font-bold"
              >
                <Clock className="h-3 w-3" />
                MANUAL REVIEW
              </Badge>
            )}
          </div>

          <div className="bg-muted/40 rounded-xl p-3 border border-primary/5 space-y-2 shadow-inner">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                  Standard TOAL
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black tracking-tight text-foreground">
                  £{toalFee}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground ml-1">
                  / op
                </span>
              </div>
            </div>

            {(site.clzEnabled || site.siteType === 'emergency') && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                      Emergency & Recovery
                    </span>
                    <div className="text-[8px] text-amber-600 font-bold tracking-tight bg-amber-500/5 px-1 rounded-sm block w-fit">
                      Only if used
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black tracking-tight text-foreground">
                      £{emergencyFee}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground ml-1">
                      / op
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2 flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
        <div className="relative min-h-[240px]">
          {/* Step 1: Operation Type */}
          <div
            className={cn(
              'transition-all duration-300 ease-in-out',
              step === 1
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 absolute inset-0 -translate-x-full pointer-events-none',
            )}
          >
            <StepOperationType
              operationType={operationType}
              setOperationType={setOperationType}
              site={site}
            />
          </div>

          {/* Step 2: Schedule */}
          <div
            className={cn(
              'transition-all duration-300 ease-in-out',
              step === 2
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 absolute inset-0 translate-x-full pointer-events-none',
            )}
          >
            <StepSchedule
              siteId={site.id}
              onSelect={(date, start, end) => {
                setSelectedDate(date)
                setSelectedStartTime(start)
                setSelectedEndTime(end)
              }}
            />
          </div>

          {/* Step 3: Mission Details */}
          <div
            className={cn(
              'transition-all duration-300 ease-in-out',
              step === 3
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 absolute inset-0 translate-x-full pointer-events-none',
            )}
          >
            <StepMissionDetails
              missionData={missionData}
              setMissionData={setMissionData}
            />
          </div>

          {/* Step 4: Checkout */}
          <div
            className={cn(
              'transition-all duration-300 ease-in-out',
              step === 4
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 absolute inset-0 translate-x-full pointer-events-none',
            )}
          >
            <StepCheckout
              operationType={operationType}
              checkoutContext={checkoutContext}
              selectedPaymentMethodId={selectedPaymentMethodId}
              onSelectPaymentMethod={setSelectedPaymentMethodId}
              onAddCard={() => setIsAddCardOpen(true)}
              emergencyAuthAgreed={emergencyAuthAgreed}
              onEmergencyAuthChange={setEmergencyAuthAgreed}
              isLoadingBilling={isCheckoutLoading}
              billingError={billingError}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="py-4 flex-shrink-0">
        <Button
          onClick={step === 4 ? handleConfirmBooking : nextStep}
          disabled={
            isNextDisabled() ||
            isLoading ||
            (step === 4 &&
              (isCheckoutLoading ||
                Boolean(billingError) ||
                Boolean(
                  checkoutContext?.requiresCard && !resolvedPaymentMethodId,
                )))
          }
          className="w-full"
        >
          {isLoading
            ? 'Processing…'
            : isStep1Loading
              ? 'Loading options…'
              : step === 1
                ? 'Select & Continue'
                : step === 2
                  ? 'Confirm Schedule'
                  : step === 3
                    ? 'Review & Pay'
                    : isAuto
                      ? 'Confirm Booking'
                      : 'Submit Request'}
        </Button>
      </CardFooter>

      <AddCardModal
        open={isAddCardOpen}
        onOpenChange={setIsAddCardOpen}
        onSuccess={handleAddCardSuccess}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mx-auto mb-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <AlertDialogTitle className="text-center text-lg">
              {isEmergency
                ? 'Emergency Standby Booked!'
                : isAuto
                  ? 'Booking Confirmed!'
                  : 'Request Submitted!'}
            </AlertDialogTitle>
            <AlertDialogDescription
              className="text-center space-y-3 pt-2"
              asChild
            >
              <div>
                <p className="text-sm text-muted-foreground">
                  {isEmergency
                    ? `Your standby site is reserved. You will only be charged £${currentFee.toFixed(2)} if you confirm usage.`
                    : isAuto
                      ? `Your ${operationType === 'toal' ? 'TOAL' : 'Emergency'} operation has been automatically approved.`
                      : 'Your request is pending landowner approval. You will be notified shortly.'}
                </p>
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2 text-left mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Ref:</span>
                    <span className="font-mono font-bold text-xs">
                      {createdBooking?.bookingReference}
                    </span>
                  </div>
                  {selectedDate && selectedStartTime && selectedEndTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Schedule:</span>
                      <span className="font-bold text-xs">
                        {format(selectedDate, 'dd MMM')} • {selectedStartTime}–
                        {selectedEndTime}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {isEmergency ? 'Potential Charge:' : 'Total Due Today:'}
                    </span>
                    <span className="font-bold">
                      {isEmergency
                        ? `£${currentFee.toFixed(2)} (if used)`
                        : `£${billingTotalToday.toFixed(2)}`}
                    </span>
                  </div>
                  {hasActiveSubscription && !isEmergency && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Billing:</span>
                      <span className="font-bold text-emerald-600">
                        {checkoutContext?.subscription.planName ??
                          'Active subscription'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className={cn(
                        'font-bold',
                        createdBooking?.status === 'APPROVED'
                          ? 'text-emerald-600'
                          : 'text-amber-600',
                      )}
                    >
                      {createdBooking?.status === 'APPROVED'
                        ? 'Approved'
                        : 'Pending Review'}
                    </span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialog}>
              Close
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={
                  createdBooking?.certificateId
                    ? () => router.push(`/certificates/${createdBooking.id}`)
                    : handleViewBookings
                }
              >
                <LinkIcon className="h-3 w-3 mr-1" />
                {createdBooking?.certificateId
                  ? 'View Certificate'
                  : 'View My Bookings'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
