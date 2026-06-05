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
import { BookingEngineSite, MissionData, OperationType } from './types'
import { PaymentFailureModal } from './payment-failure-modal'
import { bookingService } from '@/services/booking.service'
import type { Booking } from '@/services/booking.types'
import type { BookingCheckoutContext } from '@/services/booking.types'
import { AddCardModal } from '@/app/dashboard/operator/billing/components/add-card-modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/use-auth-store'

interface BookingEngineCardProps {
  site: BookingEngineSite
  className?: string
}

/** Combines a Date with an "HH:mm" string into a full UTC ISO timestamp */
function combineDateAndTime(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const dt = new Date(date)
  dt.setUTCHours(h ?? 0, m ?? 0, 0, 0)
  return dt.toISOString()
}

export function BookingEngineCard({ site, className }: BookingEngineCardProps) {
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
  const user = useAuthStore((state) => state.user)

  const [missionData, setMissionData] = React.useState<MissionData>({
    droneModel: '',
    manufacturer: '',
    airframe: '',
    mtow: '',
    weightClass: '',
    missionIntent: '',
    flyerId: user?.flyerId || '',
    operatorId: user?.operatorId || '',
    operatorPhone: user?.contactPhone || '',
  })

  React.useEffect(() => {
    if (user) {
      setMissionData((prev) => ({
        ...prev,
        flyerId: prev.flyerId || user.flyerId || '',
        operatorId: prev.operatorId || user.operatorId || '',
        operatorPhone: prev.operatorPhone || user.contactPhone || '',
      }))
    }
  }, [user])
  const [emergencyAuthAgreed, setEmergencyAuthAgreed] = React.useState(false)
  const [checkoutContext, setCheckoutContext] =
    React.useState<BookingCheckoutContext | null>(null)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = React.useState<
    string | null
  >(null)
  const [billingError, setBillingError] = React.useState<string | null>(null)
  const [isAddCardOpen, setIsAddCardOpen] = React.useState(false)
  const [showConfirmation, setShowConfirmation] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [createdBooking, setCreatedBooking] = React.useState<Booking | null>(null)
  const [paymentError, setPaymentError] = React.useState<{ message: string; bookingReference?: string | null } | null>(null)

  const nextStep = () => setStep((s) => Math.min(s + 1, 4))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))
  const progressValue = (step / 4) * 100

  const isAuto = site.autoApprove === true
  const toalFee = site.toalAccessFee || 0
  const emergencyFee = site.clzAccessFee || 0
  const canBookToal = site.siteType !== 'emergency' || toalFee > 0
  const canBookEmergency = Boolean(
    site.clzEnabled || site.siteType === 'emergency' || emergencyFee > 0,
  )
  const resolvedOperationType: OperationType = !canBookToal
    ? 'emergency'
    : !canBookEmergency
      ? 'toal'
      : operationType
  const currentFee = resolvedOperationType === 'toal' ? toalFee : emergencyFee
  const isEmergency = resolvedOperationType === 'emergency'
  const hasActiveSubscription = Boolean(
    checkoutContext?.subscription?.hasActiveSubscription,
  )
  const billingTotalToday =
    checkoutContext?.pricing.totalDueNow ??
    (resolvedOperationType === 'toal'
      ? currentFee + (hasActiveSubscription ? 0 : 5)
      : 0)
  const resolvedPaymentMethodId =
    selectedPaymentMethodId ??
    checkoutContext?.defaultPaymentMethodId ??
    checkoutContext?.paymentMethods[0]?.id ??
    null
  const isCheckoutLoading = checkoutContext === null && billingError === null

  React.useEffect(() => {
    let active = true

    bookingService
      .getCheckoutContext(
        site.id,
        resolvedOperationType === 'emergency'
          ? 'emergency_recovery'
          : 'planned_toal',
      )
      .then((context) => {
        if (!active) return
        setCheckoutContext(context)
      })
      .catch((error: unknown) => {
        if (!active) return
        setCheckoutContext(null)
        setBillingError(
          error instanceof Error
            ? error.message
            : 'Failed to load billing details',
        )
      })

    return () => {
      active = false
    }
  }, [resolvedOperationType, site.id])

  const handleOperationTypeChange = (nextOperationType: OperationType) => {
    setOperationType(nextOperationType)
    setCheckoutContext(null)
    setBillingError(null)
    setSelectedPaymentMethodId(null)
  }

  const effectiveSelectedPaymentMethodId =
    selectedPaymentMethodId &&
    checkoutContext?.paymentMethods.some(
      (method) => method.id === selectedPaymentMethodId,
    )
      ? selectedPaymentMethodId
      : (checkoutContext?.defaultPaymentMethodId ??
        checkoutContext?.paymentMethods[0]?.id ??
        null)

  const isNextDisabled = () => {
    if (step === 1) {
      const currentChoiceValid =
        (resolvedOperationType === 'toal' && canBookToal) ||
        (resolvedOperationType === 'emergency' && canBookEmergency)

      return !currentChoiceValid
    }
    if (step === 2)
      return !selectedDate || !selectedStartTime || !selectedEndTime
    if (step === 3) {
      return (
        !missionData.droneModel ||
        !missionData.manufacturer ||
        !missionData.airframe ||
        !missionData.mtow ||
        !missionData.weightClass ||
        !missionData.missionIntent ||
        !missionData.flyerId ||
        !missionData.operatorId ||
        !missionData.operatorPhone
      )
    }
    // Step 4: emergency requires auth checkbox
    if (step === 4) {
      if (isCheckoutLoading || billingError) return true
      if (checkoutContext?.requiresCard && !effectiveSelectedPaymentMethodId)
        return true
      if (isEmergency && !emergencyAuthAgreed) return true
    }
    return false
  }

  // Only show the step 1 loading label while checkout data is still loading
  const isStep1Loading = step === 1 && isCheckoutLoading

  const handleConfirmBooking = async () => {
    if (isLoading) return
    if (!selectedDate || !selectedStartTime || !selectedEndTime) return
    if (checkoutContext?.requiresCard && !effectiveSelectedPaymentMethodId) {
      toast.error('Please add or select a payment card before booking.')
      return
    }
    setIsLoading(true)

    try {
      const startISO = combineDateAndTime(selectedDate, selectedStartTime)
      const endISO = combineDateAndTime(selectedDate, selectedEndTime)
      const paymentMethodId = resolvedPaymentMethodId ?? undefined

      const result = await bookingService.createBooking({
        siteId: site.id,
        startTime: startISO,
        endTime: endISO,
        droneModel: missionData.droneModel,
        manufacturer: missionData.manufacturer,
        airframe: missionData.airframe,
        mtow: missionData.mtow,
        missionIntent: missionData.missionIntent,
        billingMode:
          checkoutContext?.pricing.billingMode ??
          (hasActiveSubscription ? 'subscription' : 'payg'),
        useCategory: isEmergency ? 'emergency_recovery' : 'planned_toal',
        operationReference: missionData.operationReference,
        flyerId: missionData.flyerId,
        operatorPhone: missionData.operatorPhone,
        paymentMethodId,
        ...(isEmergency && { emergencyAuthAgreed: true }),
      })

      if ('requiresAction' in result && result.requiresAction) {
        // Handle 3D Secure authentication
        const { getStripe } = await import('@/lib/stripe-client')
        const stripe = await getStripe()
        
        if (!stripe) {
          throw new Error('Stripe failed to initialize.')
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(result.clientSecret)
        
        if (error) {
          try {
            await bookingService.cancelBooking(result.bookingId)
          } catch (cancelError) {
            console.error('Failed to cancel incomplete booking', cancelError)
          }
          throw new Error(error.message || 'Payment authentication failed. The booking has been cancelled so you can try again.')
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          const finalizedBooking = await bookingService.confirmBookingPayment(result.bookingId, paymentIntent.id)
          setCreatedBooking(finalizedBooking)
          setShowConfirmation(true)
        } else {
          try {
            await bookingService.cancelBooking(result.bookingId)
          } catch (cancelError) {
            console.error('Failed to cancel incomplete booking', cancelError)
          }
          throw new Error('Payment was not successful. The booking has been cancelled.')
        }
      } else {
        setCreatedBooking(result as Booking)
        setShowConfirmation(true)
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Booking failed. Please try again.'
      const isPaymentRelated = errMsg.toLowerCase().includes('payment') ||
        errMsg.toLowerCase().includes('card') ||
        errMsg.toLowerCase().includes('charge') ||
        errMsg.toLowerCase().includes('stripe') ||
        errMsg.toLowerCase().includes('authentication')

      if (isPaymentRelated) {
        setPaymentError({
          message: errMsg,
          bookingReference: createdBooking?.bookingReference ?? null,
        })
      } else {
        toast.error(errMsg)
      }
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

  const handleRetryBooking = () => {
    setPaymentError(null)
    setStep(4)
  }

  const handleViewBookings = () => {
    router.push('/dashboard/operator/bookings')
  }

  const handleAddCardSuccess = async () => {
    setIsAddCardOpen(false)
    setBillingError(null)
    setCheckoutContext(null)

    try {
      const context = await bookingService.getCheckoutContext(
        site.id,
        resolvedOperationType === 'emergency'
          ? 'emergency_recovery'
          : 'planned_toal',
      )
      setCheckoutContext(context)
    } catch (error: unknown) {
      setCheckoutContext(null)
      setBillingError(
        error instanceof Error
          ? error.message
          : 'Failed to load billing details',
      )
    }
  }

  return (
    <Card className={cn("shadow-2xl border-primary/10 overflow-hidden bg-background/80 backdrop-blur-md flex flex-col", className)}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <Progress
          value={progressValue}
          className="h-1 rounded-none bg-primary/10"
        />
      </div>

      <CardHeader className="p-3 pb-1 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">
            Step {step} of 4
          </span>
          {step > 1 && (
            <Button
              variant="ghost"
              size="xs"
              className="h-6 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground px-2"
              onClick={prevStep}
            >
              <ChevronLeft className="mr-1 h-3 w-3" />
              Back
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1 px-3 pb-3 flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
        {/* Pricing details now scrollable with the content */}
        <div className="space-y-2 mb-2 shrink-0">
          <div className="flex items-center gap-2">
            {isAuto ? (
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 text-[9px] py-0 px-1.5 font-bold"
              >
                <Zap className="h-3 w-3 fill-current" />
                AUTO-APPROVAL
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 text-[9px] py-0 px-1.5 font-bold"
              >
                <Clock className="h-3 w-3" />
                MANUAL REVIEW
              </Badge>
            )}
          </div>

          <div className="bg-muted/40 rounded-xl p-2.5 border border-primary/5 space-y-1.5 shadow-inner">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                  Standard TOAL
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-black tracking-tight text-foreground">
                  £{toalFee}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground ml-1">
                  / op
                </span>
              </div>
            </div>

            {(site.clzEnabled || site.siteType === 'emergency') && (
              <div className="pt-1.5 border-t border-border/50">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      Emergency & Recovery
                    </span>
                    <div className="text-[8px] text-amber-600 font-bold tracking-tight bg-amber-500/5 px-1 rounded-sm block w-fit">
                      Only if used
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black tracking-tight text-foreground">
                      £{emergencyFee}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground ml-1">
                      / op
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative min-h-[220px]">
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
              operationType={resolvedOperationType}
              setOperationType={handleOperationTypeChange}
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
              operationType={resolvedOperationType}
              checkoutContext={checkoutContext}
              selectedPaymentMethodId={effectiveSelectedPaymentMethodId}
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

      <CardFooter className="p-3 pt-1 shrink-0">
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
          className="w-full h-9 text-xs"
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

      <PaymentFailureModal
        isOpen={paymentError !== null}
        errorMessage={paymentError?.message ?? null}
        bookingReference={paymentError?.bookingReference}
        onClose={() => setPaymentError(null)}
        onRetry={handleRetryBooking}
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
                ? 'Emergency and recovery Allocated!'
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
                    ? `Your standby site is reserved. No charge is taken now, and no funds are held. You will only be charged £${currentFee.toFixed(2)} if usage is confirmed.`
                    : isAuto
                      ? createdBooking?.isPayg
                        ? `Your ${resolvedOperationType === 'toal' ? 'TOAL' : 'Emergency'} operation has been automatically approved and your card is being charged now for the site access fee plus service fee.`
                        : `Your ${resolvedOperationType === 'toal' ? 'TOAL' : 'Emergency'} operation has been automatically approved under your subscription. The subscription covers the service fee, so only the site access fee applies now.`
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
                        {checkoutContext?.subscription?.planName ??
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
