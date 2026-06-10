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
import { ChevronLeft, Clock, Zap } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { StepOperationType } from './step-operation-type'
import { StepSchedule } from './step-schedule'
import { StepMissionDetails } from './step-mission-details'
import { StepCheckout } from './step-checkout'
import { BookingEngineSite, MissionData, OperationType } from './types'
import { bookingService } from '@/services/booking.service'
import type { Booking } from '@/services/booking.types'
import type { BookingCheckoutContext } from '@/services/booking.types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/use-auth-store'

interface BookingEngineCardProps {
  site: BookingEngineSite
  className?: string
  initialOperationType?: OperationType
}

/** Combines a Date with an "HH:mm" string into a full UTC ISO timestamp */
function combineDateAndTime(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const dt = new Date(date)
  dt.setUTCHours(h ?? 0, m ?? 0, 0, 0)
  return dt.toISOString()
}

export function BookingEngineCard({ site, className, initialOperationType }: BookingEngineCardProps) {
  const router = useRouter()

  const [step, setStep] = React.useState(1)
  const [operationType, setOperationType] =
    React.useState<OperationType>(initialOperationType || 'toal')
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
    aircraftId: '',
    droneModel: '',
    manufacturer: '',
    airframe: '',
    mtow: '',
    missionIntent: '',
    supportingDocuments: [],
    flyerId: user?.flyerId || '',
    operatorId: user?.operatorId || '',
    operatorPhone: user?.contactPhone || '',
    operationType: 'INBOUND',
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
  const [billingError, setBillingError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

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
  }

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
        !missionData.aircraftId ||
        !missionData.missionIntent
      )
    }
    // Step 4: emergency requires auth checkbox
    if (step === 4) {
      if (isCheckoutLoading || billingError) return true
      if (isEmergency && !emergencyAuthAgreed) return true
    }
    return false
  }

  // Only show the step 1 loading label while checkout data is still loading
  const isStep1Loading = step === 1 && isCheckoutLoading

  const handleConfirmBooking = async () => {
    if (isLoading) return
    if (!selectedDate || !selectedStartTime || !selectedEndTime) return
    setIsLoading(true)

    try {
      const startISO = combineDateAndTime(selectedDate, selectedStartTime)
      const endISO = combineDateAndTime(selectedDate, selectedEndTime)

      const result = await bookingService.createBooking({
        siteId: site.id,
        startTime: startISO,
        endTime: endISO,
        aircraftId: missionData.aircraftId,
        missionIntent: missionData.missionIntent,
        billingMode:
          checkoutContext?.pricing.billingMode ??
          (hasActiveSubscription ? 'subscription' : 'payg'),
        useCategory: isEmergency ? 'emergency_recovery' : 'planned_toal',
        operationType: missionData.operationType,
        operationReference: missionData.operationReference,
        flyerId: missionData.flyerId,
        operatorPhone: missionData.operatorPhone,
        supportingDocuments: missionData.supportingDocuments,
        ...(isEmergency && { emergencyAuthAgreed: true }),
      })

      const booking = result as Booking
      const bookingRef = booking.bookingReference ?? 'your booking'
      toast.success(
        `${bookingRef} created. Redirecting to mission planning...`,
      )
      router.push('/dashboard/operator/bookings')
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : 'Booking failed. Please try again.'
      toast.error(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card
      className={cn(
        'border-primary/10 overflow-hidden bg-background/80 backdrop-blur-md flex flex-col',
        className,
      )}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <Progress
          value={progressValue}
          className="h-1 rounded-none bg-primary/10"
        />
      </div>

      <CardHeader className="p-3 pb-1 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Step {step} of 4
          </span>
          {step > 1 && (
            <Button
              variant="ghost"
              size="xs"
              className="h-6 text-xs font-semibold text-muted-foreground hover:text-foreground px-2"
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
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 text-xs py-0.5 px-2 h-5 font-semibold"
              >
                <Zap className="h-3 w-3 fill-current" />
                Auto-Approval
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 text-xs py-0.5 px-2 h-5 font-semibold"
              >
                <Clock className="h-3 w-3" />
                Manual Review
              </Badge>
            )}
          </div>

          <div className="bg-muted/40 rounded-xl p-2.5 border border-primary/5 space-y-1.5 shadow-inner">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Standard TOAL
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-black tracking-tight text-foreground">
                  £{toalFee}
                </span>
                <span className="text-xs text-muted-foreground ml-1">/ op</span>
              </div>
            </div>

            {(site.clzEnabled || site.siteType === 'emergency') && (
              <div className="pt-1.5 border-t border-border/50">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Emergency & Recovery
                    </span>
                    <div className="text-xs text-amber-600 font-semibold tracking-tight bg-amber-500/5 px-1.5 rounded-sm block w-fit">
                      Only if used
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black tracking-tight text-foreground">
                      £{emergencyFee}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
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
                Boolean(billingError)))
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
                  ? !selectedDate
                    ? 'Select a Date'
                    : !selectedStartTime
                      ? 'Select Start Time'
                      : !selectedEndTime
                        ? 'Select End Time (2nd Click)'
                        : 'Confirm Schedule'
                  : step === 3
                    ? 'Review'
                    : isAuto
                      ? 'Confirm Booking'
                      : 'Submit Request'}
        </Button>
      </CardFooter>
    </Card>
  )
}
