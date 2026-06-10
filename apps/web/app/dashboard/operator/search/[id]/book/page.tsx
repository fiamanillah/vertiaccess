'use client'

import * as React from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Plane,
  FileText,
  CreditCard,
  Loader2,
  ShieldCheck,
  Plus,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '@/store/use-auth-store'
import { siteService } from '@/services/site.service'
import { aircraftService, AircraftDto } from '@/services/aircraft.service'
import { bookingService } from '@/services/booking.service'
import { toast } from 'sonner'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Separator } from '@workspace/ui/components/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { FileUploader } from '@/components/file-uploader'
import type { BookingCheckoutContext, PaymentMethod, AvailabilitySlotRaw } from '@/services/booking.types'
import { format, isBefore, startOfToday, parseISO } from 'date-fns'
import { cn } from '@workspace/ui/lib/utils'

// Lazy-load the map to avoid SSR issues with Leaflet
const InfrastructureDetailMap = dynamic(
  () =>
    import('../../../../assetmanager/infrastructure/components/infrastructure-detail-map').then(
      (mod) => mod.InfrastructureDetailMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted/30 animate-pulse rounded-xl" />
    ),
  },
)

const MISSION_INTENT_OPTIONS = [
  'Telecom Tower Inspection',
  'Powerline Inspection',
  'Railway Track Inspections',
  'Pipeline Inspections',
  'Bridge Inspections',
  'Wind Tru',
] as const

const steps = [
  { id: 1, title: 'Access Tier', description: 'Choose Operational Access' },
  { id: 2, title: 'Schedule Flight', description: 'Configure Date & Time Slots' },
  { id: 3, title: 'Flight Mission', description: 'Details and Aircraft Setup' },
  { id: 4, title: 'Review', description: 'Confirm and Submit Booking' },
]

function formatMoney(value: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

function parseTimeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function formatMinsToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function findClosestAlternative(
  startTime: string,
  endTime: string,
  existingBookings: AvailabilitySlotRaw[]
): { startTime: string; endTime: string } | null {
  const requestedStart = parseTimeToMins(startTime)
  const requestedEnd = parseTimeToMins(endTime)
  const duration = requestedEnd - requestedStart

  if (duration <= 0) return null

  // Map existing bookings to minute ranges
  const bookedRanges = existingBookings.map(b => {
    const bStart = new Date(b.startTime)
    const bEnd = new Date(b.endTime)
    // We adjust for UTC offset to align with raw hour slot indices
    const startMins = bStart.getUTCHours() * 60 + bStart.getUTCMinutes()
    const endMins = bEnd.getUTCHours() * 60 + bEnd.getUTCMinutes()
    return { start: startMins, end: endMins }
  })

  let forwardFound: { start: number; end: number } | null = null
  let backwardFound: { start: number; end: number } | null = null

  // Search forward in 30 minutes increments
  for (let s = requestedStart; s <= 1440 - duration; s += 30) {
    const e = s + duration
    const overlap = bookedRanges.some(b => s < b.end && e > b.start)
    if (!overlap) {
      forwardFound = { start: s, end: e }
      break
    }
  }

  // Search backward in 30 minutes increments
  for (let s = requestedStart - 30; s >= 0; s -= 30) {
    const e = s + duration
    const overlap = bookedRanges.some(b => s < b.end && e > b.start)
    if (!overlap) {
      backwardFound = { start: s, end: e }
      break
    }
  }

  let best = forwardFound || backwardFound || null
  if (forwardFound && backwardFound) {
    const forwardDiff = Math.abs(forwardFound.start - requestedStart)
    const backwardDiff = Math.abs(requestedStart - backwardFound.start)
    best = forwardDiff < backwardDiff ? forwardFound : backwardFound
  }

  if (best) {
    return {
      startTime: formatMinsToTime(best.start),
      endTime: formatMinsToTime(best.end),
    }
  }

  return null
}

export default function BookSitePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const siteId = params.id as string

  const user = useAuthStore((state) => state.user)

  // Page level states
  const [site, setSite] = React.useState<any>(null)
  const [allSites, setAllSites] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentStep, setCurrentStep] = React.useState(1)

  // Step 1 states
  const [operationType, setOperationType] = React.useState<'toal' | 'emergency'>('toal')

  // Step 2 states
  const [startDate, setStartDate] = React.useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = React.useState<string>('09:00')
  const [endDate, setEndDate] = React.useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [endTime, setEndTime] = React.useState<string>('10:00')
  
  const [existingBookings, setExistingBookings] = React.useState<AvailabilitySlotRaw[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false)
  const [hasCheckedSlots, setHasCheckedSlots] = React.useState(false)
  const [conflictError, setConflictError] = React.useState<string | null>(null)
  const [alternativeSuggestion, setAlternativeSuggestion] = React.useState<string | null>(null)

  // Step 3 states
  const [savedAircrafts, setSavedAircrafts] = React.useState<AircraftDto[]>([])
  const [activeAircraftId, setActiveAircraftId] = React.useState<string>('')
  const [isLoadingAircrafts, setIsLoadingAircrafts] = React.useState(true)
  const [showAircraftSandbox, setShowAircraftSandbox] = React.useState(false)
  
  // Sandbox form fields
  const [newAircraftName, setNewAircraftName] = React.useState('')
  const [newAircraftModel, setNewAircraftModel] = React.useState('')
  const [newAircraftManufacturer, setNewAircraftManufacturer] = React.useState('')
  const [newAircraftAirframe, setNewAircraftAirframe] = React.useState<'Rotary' | 'Fixed-Wing' | 'Hybrid'>('Rotary')
  const [newAircraftMtow, setNewAircraftMtow] = React.useState('')
  const [newAircraftSerial, setNewAircraftSerial] = React.useState('')
  const [newAircraftReg, setNewAircraftReg] = React.useState('')
  const [newAircraftIcao, setNewAircraftIcao] = React.useState('')
  const [isSavingAircraft, setIsSavingAircraft] = React.useState(false)

  const [missionIntent, setMissionIntent] = React.useState<string>('')
  const [supportingDocuments, setSupportingDocuments] = React.useState<any[]>([])
  const [flightType, setFlightType] = React.useState<'INBOUND' | 'OUTBOUND'>('INBOUND')
  const [operatorPhone, setOperatorPhone] = React.useState('')

  // Step 4 states
  const [checkoutContext, setCheckoutContext] = React.useState<BookingCheckoutContext | null>(null)
  const [billingError, setBillingError] = React.useState<string | null>(null)
  const [isLoadingBilling, setIsLoadingBilling] = React.useState(false)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = React.useState<string | null>(null)
  const [emergencyAuthAgreed, setEmergencyAuthAgreed] = React.useState(false)
  const [isSubmittingBooking, setIsSubmittingBooking] = React.useState(false)

  // Setup initial tab from query parameter
  React.useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam === 'emergency') {
      setOperationType('emergency')
    } else {
      setOperationType('toal')
    }
  }, [searchParams])

  // Sync user phone number to state
  React.useEffect(() => {
    if (user?.contactPhone) {
      setOperatorPhone(user.contactPhone)
    }
  }, [user])

  // Load site details and all sites for leaflet rendering
  React.useEffect(() => {
    let mounted = true
    async function loadSiteData() {
      try {
        setIsLoading(true)
        const [siteRes, listRes] = await Promise.all([
          siteService.getPublicSite(siteId),
          siteService.listSites(),
        ])
        if (!mounted) return
        if (siteRes.success && siteRes.data) {
          setSite(siteRes.data)
        }
        if (listRes.success && Array.isArray(listRes.data)) {
          setAllSites(listRes.data)
        }
      } catch (err: any) {
        toast.error('Failed to load site details', {
          description: err.message || 'An error occurred.',
        })
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadSiteData()
    return () => { mounted = false }
  }, [siteId])

  // Load operator's aircraft inventory
  const fetchAircrafts = React.useCallback(async () => {
    setIsLoadingAircrafts(true)
    try {
      const res = await aircraftService.listAircrafts()
      if (res.success && Array.isArray(res.data)) {
        setSavedAircrafts(res.data)
        if (res.data.length > 0 && !activeAircraftId) {
          setActiveAircraftId(res.data[0]?.id || '')
        }
      }
    } catch (err: any) {
      console.error('Failed to load aircraft list', err)
    } finally {
      setIsLoadingAircrafts(false)
    }
  }, [activeAircraftId])

  React.useEffect(() => {
    fetchAircrafts()
  }, [fetchAircrafts])

  // Fetch Checkout Billing context immediately on form initialization (mount)
  React.useEffect(() => {
    let active = true
    setIsLoadingBilling(true)
    setBillingError(null)

    bookingService
      .getCheckoutContext(
        siteId,
        operationType === 'emergency' ? 'emergency_recovery' : 'planned_toal'
      )
      .then((context) => {
        if (!active) return
        setCheckoutContext(context)
      })
      .catch((error: any) => {
        if (!active) return
        setCheckoutContext(null)
        setBillingError(error.message || 'Failed to load checkout details')
      })
      .finally(() => {
        if (active) setIsLoadingBilling(false)
      })

    return () => { active = false }
  }, [siteId, operationType])

  // Check Slots availability
  const checkSlotAvailability = async () => {
    if (!startDate) {
      toast.error('Please select a date first.')
      return
    }

    setIsLoadingSlots(true)
    setConflictError(null)
    setAlternativeSuggestion(null)
    try {
      const result = await bookingService.getAvailability(siteId, startDate)
      setExistingBookings(result.existingBookings || [])
      setHasCheckedSlots(true)
      toast.success('Availability slots fetched successfully.')

      // Validate overlap immediately
      validateSelectedTimeOverlap(result.existingBookings || [])
    } catch (err: any) {
      toast.error('Failed to fetch slot availability.')
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const validateSelectedTimeOverlap = (bookingsList: AvailabilitySlotRaw[]) => {
    const selStart = parseTimeToMins(startTime)
    const selEnd = parseTimeToMins(endTime)
    
    // Check overlap
    const hasCollision = bookingsList.some(b => {
      const bStart = new Date(b.startTime)
      const bEnd = new Date(b.endTime)
      const startMins = bStart.getUTCHours() * 60 + bStart.getUTCMinutes()
      const endMins = bEnd.getUTCHours() * 60 + bEnd.getUTCMinutes()
      return selStart < endMins && selEnd > startMins
    })

    if (hasCollision) {
      setConflictError('Time conflict detected: The requested slot overlaps with an existing reservation.')
      const alt = findClosestAlternative(startTime, endTime, bookingsList)
      if (alt) {
        setAlternativeSuggestion(`Suggested alternative slot: ${alt.startTime} - ${alt.endTime} on the same day`)
      } else {
        setAlternativeSuggestion('No alternative slot available on this day. Please try a different date.')
      }
    } else {
      setConflictError(null)
      setAlternativeSuggestion(null)
    }
  }

  // Trigger collision check when date/times are updated
  React.useEffect(() => {
    if (hasCheckedSlots) {
      validateSelectedTimeOverlap(existingBookings)
    }
  }, [startTime, endTime])

  // Save new aircraft inline
  const handleRegisterAircraftInline = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAircraftName || !newAircraftManufacturer || !newAircraftModel || !newAircraftMtow) {
      toast.error('Please fill out all required fields.')
      return
    }

    setIsSavingAircraft(true)
    try {
      const res = await aircraftService.createAircraft({
        name: newAircraftName,
        manufacturer: newAircraftManufacturer,
        droneModel: newAircraftModel,
        airframe: newAircraftAirframe,
        mtow: newAircraftMtow,
        serialNumber: newAircraftSerial || null,
        registrationNumber: newAircraftReg || null,
        icaoAddress: newAircraftIcao || null,
      })

      if (res.success && res.data) {
        toast.success('Aircraft registered successfully!')
        await fetchAircrafts()
        if (res.data.id) {
          setActiveAircraftId(res.data.id)
        }
        // Collapse sandbox
        setShowAircraftSandbox(false)
        // Reset fields
        setNewAircraftName('')
        setNewAircraftManufacturer('')
        setNewAircraftModel('')
        setNewAircraftMtow('')
        setNewAircraftSerial('')
        setNewAircraftReg('')
        setNewAircraftIcao('')
      } else {
        toast.error(res.message || 'Failed to register aircraft.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred during registration.')
    } finally {
      setIsSavingAircraft(false)
    }
  }

  // Next Step validation
  const nextStep = async () => {
    if (currentStep === 1) {
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      if (startDate !== endDate) {
        toast.error('Single-day flight range enforcement: Start date and end date must match exactly.')
        return
      }
      if (parseTimeToMins(startTime) >= parseTimeToMins(endTime)) {
        toast.error('End time must be after start time.')
        return
      }
      if (conflictError) {
        toast.error('Please resolve time slot conflicts before proceeding.')
        return
      }
      setCurrentStep(3)
      return
    }

    if (currentStep === 3) {
      if (!activeAircraftId) {
        toast.error('Please select or register an aircraft.')
        return
      }
      if (!missionIntent) {
        toast.error('Please select mission intent.')
        return
      }
      setCurrentStep(4)
      return
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  // Map helper points
  const mappedDetailedSite = site ? {
    id: site.id,
    vaId: site.vaId || undefined,
    name: site.name,
    category: site.siteCategory || 'Vertiport',
    siteType: site.siteType || 'toal',
    address: site.address,
    postcode: site.postcode,
    latitude: site.geometry?.center?.lat ?? 51.505,
    longitude: site.geometry?.center?.lng ?? -0.09,
    toalRadius: site.geometry?.radius || 100,
    toalGeometryMode: site.geometry?.type || 'circle',
    toalPolygonPoints: site.geometry?.points ? site.geometry.points.map((p: any) => [p.lat, p.lng]) : [],
    allowEmergencyLanding: !!site.emergencyRecoveryEnabled,
    emergencyRadius: site.clzGeometry?.radius || 350,
    emergencyGeometryMode: site.clzGeometry?.type || 'circle',
    emergencyPolygonPoints: site.clzGeometry?.points ? site.clzGeometry.points.map((p: any) => [p.lat, p.lng]) : [],
    contactEmail: site.contactEmail,
    contactPhone: site.contactPhone,
    description: site.description || '',
    photoUrls: [],
    isPermanentActivation: !site.validityEnd,
    bookingApprovalModel: site.autoApprove ? 'auto' : 'manual',
    policyDocuments: [],
    toalFee: Number(site.toalAccessFee) || 0,
    emergencyFee: Number(site.clzAccessFee) || 0,
    status: 'active',
    createdAt: '',
  } as any : null

  // Confirm booking
  const handleConfirmBooking = async () => {
    if (isSubmittingBooking) return

    const selectedAircraft = savedAircrafts.find(a => a.id === activeAircraftId)
    if (!selectedAircraft) {
      toast.error('Please select an aircraft.')
      return
    }

    setIsSubmittingBooking(true)
    try {
      const startISO = new Date(`${startDate}T${startTime}:00.000Z`).toISOString()
      const endISO = new Date(`${endDate}T${endTime}:00.000Z`).toISOString()

      await bookingService.createBooking({
        siteId,
        startTime: startISO,
        endTime: endISO,
        aircraftId: activeAircraftId,
        missionIntent,
        billingMode: checkoutContext?.pricing.billingMode ?? (checkoutContext?.subscription?.hasActiveSubscription ? 'subscription' : 'payg'),
        useCategory: operationType === 'emergency' ? 'emergency_recovery' : 'planned_toal',
        operationType: flightType,
        flyerId: user?.flyerId || '',
        operatorPhone: operatorPhone || '',
        supportingDocuments: supportingDocuments.map(doc => ({
          fileKey: doc.fileKey,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
        })),
        ...(operationType === 'emergency' && { emergencyAuthAgreed: true }),
      })

      toast.success('Flight booking created successfully!')
      router.push('/dashboard/operator/bookings')
    } catch (err: any) {
      toast.error(err.message || 'Booking submission failed.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  const isNextDisabled = () => {
    if (currentStep === 1) return false
    if (currentStep === 2) return !startDate || !startTime || !endTime || !!conflictError
    if (currentStep === 3) return !activeAircraftId || !missionIntent || !operatorPhone
    if (currentStep === 4) {
      if (isLoadingBilling || billingError) return true
      if (operationType === 'emergency' && !emergencyAuthAgreed) return true
    }
    return false
  }

  if (isLoading || !site) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading flight planner...</p>
      </div>
    )
  }

  if (billingError && (billingError.toLowerCase().includes('payment') || billingError.toLowerCase().includes('card') || billingError.toLowerCase().includes('transaction'))) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 flex flex-col items-center text-center w-full min-h-[60vh] justify-center">
        <div className="mb-6 rounded-full bg-red-50 p-6 dark:bg-red-950/20">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">Billing Profile Incomplete</h1>
        <p className="text-muted-foreground font-medium mb-8 max-w-md">
          {billingError}
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/operator/search')} className="font-bold">
            Back to Search
          </Button>
          <Button asChild className="font-bold"><Link href="/dashboard/operator/billing">Go to Billing Settings</Link></Button>
        </div>
      </div>
    )
  }

  const stepMeta = steps[currentStep - 1]

  const totalSitesList = mappedDetailedSite ? [mappedDetailedSite, ...allSites.filter(s => s.id !== siteId).map(s => ({ ...s, latitude: s.geometry?.center?.lat, longitude: s.geometry?.center?.lng }))] : []

  return (
    <div className="flex w-full min-h-[calc(100vh-84px)] flex-col lg:flex-row">
      {/* Left side: Wizard container */}
      <div className="flex-1 lg:w-[45%] lg:flex-none border-r flex flex-col min-w-0 bg-background relative">
        {/* Sticky Step Header */}
        <div className="px-6 py-5 border-b bg-muted/30 sticky top-16 z-40 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => {
                if (currentStep > 1) {
                  prevStep()
                } else {
                  router.push(`/dashboard/operator/search`)
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-sm font-bold text-foreground">
                Step {currentStep} of {steps.length}: {stepMeta?.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{stepMeta?.description}</p>
            </div>
          </div>
          
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Form Forms */}
        <div className="flex-1 p-6 pb-24 overflow-y-auto">
          
          {/* Step 1: Access Tier */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Choose Operational Access</h3>
                <p className="text-xs text-muted-foreground">Select the Access Tier Matching Your Flight Intent.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setOperationType('toal')}
                  className={cn(
                    'flex flex-col gap-2 p-4 rounded-xl border text-left transition-all',
                    operationType === 'toal' ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'border-border hover:border-primary/30'
                  )}
                >
                  <span className="font-bold text-xs uppercase tracking-wider block text-foreground">
                    Planned Take-off & Landing
                  </span>
                  <span className="text-base font-bold text-primary">
                    {formatMoney(site.toalAccessFee || 0)}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Standard pre-planned launch and landing access slots.
                  </p>
                </button>

                {(site.emergencyRecoveryEnabled || site.siteType === 'emergency') && (
                  <button
                    type="button"
                    onClick={() => setOperationType('emergency')}
                    className={cn(
                      'flex flex-col gap-2 p-4 rounded-xl border text-left transition-all',
                      operationType === 'emergency' ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/10' : 'border-border hover:border-amber-500/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wider block text-foreground">
                        Emergency & Recovery Standby
                      </span>
                    </div>
                    <span className="text-base font-bold text-amber-600">
                      {formatMoney(site.clzAccessFee || 0)}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Safe-haven fallback landing. Charges apply only upon actual deployment/landing.
                    </p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Schedule Flight</h3>
                <p className="text-xs text-muted-foreground">Define Single-Day Flight Dates and Hours.</p>
              </div>

              {/* Start Date & Time */}
              <div className="rounded-xl border border-border p-3.5 bg-muted/20 space-y-3">
                <h4 className="text-[10px] uppercase font-black tracking-widest text-primary">Start Date & Time</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value)
                        setEndDate(e.target.value) // Auto sync end date to enforce single-day
                        setHasCheckedSlots(false)
                      }}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value)
                        setHasCheckedSlots(false)
                      }}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* End Date & Time */}
              <div className="rounded-xl border border-border p-3.5 bg-muted/20 space-y-3">
                <h4 className="text-[10px] uppercase font-black tracking-widest text-primary">End Date & Time</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">End Date (Locked)</Label>
                    <Input
                      type="date"
                      value={endDate}
                      disabled
                      className="h-9 text-xs opacity-80"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value)
                        setHasCheckedSlots(false)
                      }}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* View Slot Trigger */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-9 text-xs font-bold"
                onClick={checkSlotAvailability}
                disabled={isLoadingSlots}
              >
                {isLoadingSlots ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Checking slots...
                  </>
                ) : (
                  'View Slot'
                )}
              </Button>

              {/* Conflict notice banner */}
              {conflictError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2 text-rose-800 dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">Slot Collision Detected</p>
                      <p className="text-xs font-medium mt-0.5">{conflictError}</p>
                    </div>
                  </div>
                  {alternativeSuggestion && (
                    <div className="border-t border-rose-500/10 pt-2 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                      {alternativeSuggestion}
                    </div>
                  )}
                </div>
              )}

              {/* Availability Slots Grid */}
              {hasCheckedSlots && !isLoadingSlots && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Availability Grid</h4>
                  <div className="rounded-xl border bg-muted/10 p-3 max-h-[160px] overflow-y-auto grid grid-cols-4 gap-1.5">
                    {Array.from({ length: 24 }).map((_, idx) => {
                      const hourStr = `${String(idx).padStart(2, '0')}:00`
                      const isBooked = existingBookings.some(b => {
                        const bStart = new Date(b.startTime)
                        const bEnd = new Date(b.endTime)
                        const startMins = bStart.getUTCHours() * 60 + bStart.getUTCMinutes()
                        const endMins = bEnd.getUTCHours() * 60 + bEnd.getUTCMinutes()
                        const slotMins = idx * 60
                        return slotMins >= startMins && slotMins < endMins
                      })
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'p-1.5 border rounded text-[10px] text-center font-mono font-bold',
                            isBooked ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200' : 'bg-background text-foreground'
                          )}
                        >
                          {hourStr}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Flight Mission */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Flight Mission</h3>
                <p className="text-xs text-muted-foreground">Configure Aircraft Asset Assignment and Operator IDs.</p>
              </div>

              {/* Aircraft selector */}
              <div className="rounded-xl border border-border p-3.5 bg-muted/20 space-y-2.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-primary">Aircraft Selection</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-primary hover:bg-primary/5"
                    onClick={() => setShowAircraftSandbox(!showAircraftSandbox)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Register Aircraft
                  </Button>
                </div>

                {isLoadingAircrafts ? (
                  <p className="text-xs text-muted-foreground">Loading registered aircraft...</p>
                ) : savedAircrafts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No aircraft registered yet. Register a new aircraft below.</p>
                ) : (
                  <Select value={activeAircraftId} onValueChange={setActiveAircraftId}>
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Select registered aircraft" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedAircrafts.map((aircraft) => (
                        <SelectItem key={aircraft.id} value={aircraft.id || ''}>
                          {aircraft.name} ({aircraft.manufacturer} {aircraft.droneModel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Inline Expandable Aircraft Sandbox */}
                {(showAircraftSandbox || savedAircrafts.length === 0) && (
                  <form onSubmit={handleRegisterAircraftInline} className="border-t border-border/40 pt-3.5 mt-2 space-y-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Register New Aircraft Sandbox</h5>
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Aircraft Name</Label>
                          <Input
                            placeholder="e.g. Inspector Alpha"
                            value={newAircraftName}
                            onChange={(e) => setNewAircraftName(e.target.value)}
                            className="h-8 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Manufacturer</Label>
                          <Input
                            placeholder="e.g. DJI"
                            value={newAircraftManufacturer}
                            onChange={(e) => setNewAircraftManufacturer(e.target.value)}
                            className="h-8 text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Model</Label>
                          <Input
                            placeholder="e.g. Matrice 300 RTK"
                            value={newAircraftModel}
                            onChange={(e) => setNewAircraftModel(e.target.value)}
                            className="h-8 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Airframe</Label>
                          <Select
                            value={newAircraftAirframe}
                            onValueChange={(val: any) => setNewAircraftAirframe(val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Rotary">Rotary</SelectItem>
                              <SelectItem value="Fixed-Wing">Fixed-Wing</SelectItem>
                              <SelectItem value="Hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">MTOW (kg)</Label>
                          <Input
                            type="number"
                            placeholder="e.g. 9"
                            value={newAircraftMtow}
                            onChange={(e) => setNewAircraftMtow(e.target.value)}
                            className="h-8 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Serial Number</Label>
                          <Input
                            placeholder="Optional"
                            value={newAircraftSerial}
                            onChange={(e) => setNewAircraftSerial(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSavingAircraft}
                      className="w-full h-8 text-[10px] font-bold"
                    >
                      {isSavingAircraft ? 'Registering...' : 'Register and Select Aircraft'}
                    </Button>
                  </form>
                )}
              </div>

              {/* Mission Intent */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Mission Intent</Label>
                <Select value={missionIntent} onValueChange={setMissionIntent}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Select intent" />
                  </SelectTrigger>
                  <SelectContent>
                    {MISSION_INTENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supporting Documents (without Compliant tag) */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Supporting Documents</Label>
                <FileUploader
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={15}
                  category="GENERAL"
                  onUploadComplete={setSupportingDocuments}
                />
              </div>

              {/* Flyer ID (Autofilled and Read-only) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Flyer ID</Label>
                  <Input
                    value={user?.flyerId || ''}
                    readOnly
                    disabled
                    className="h-9 text-xs opacity-70 cursor-not-allowed bg-muted"
                  />
                </div>
                {/* Operator ID (Autofilled and Read-only) */}
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Operator ID</Label>
                  <Input
                    value={user?.operatorId || ''}
                    readOnly
                    disabled
                    className="h-9 text-xs opacity-70 cursor-not-allowed bg-muted"
                  />
                </div>
              </div>

              {/* Operator Phone (Autofilled and Editable) */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Operator Phone</Label>
                <Input
                  value={operatorPhone}
                  onChange={(e) => setOperatorPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Inbound/Outbound Operation Type */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Operation Type</Label>
                <Select value={flightType} onValueChange={(val: any) => setFlightType(val)}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INBOUND">Inbound</SelectItem>
                    <SelectItem value="OUTBOUND">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 4: Checkout (Decoupled Review) */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Review</h3>
                <p className="text-xs text-muted-foreground">Confirm Access Details and Submit Booking.</p>
              </div>

              {/* Checkout info card */}
              <div className="rounded-xl border border-border p-3.5 bg-muted/20 space-y-3.5">
                {isLoadingBilling ? (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Fetching billing details...
                  </div>
                ) : billingError ? (
                  <p className="text-xs text-destructive">{billingError}</p>
                ) : checkoutContext ? (
                  <>
                    {/* Manual review status isolated ONLY inside policy card */}
                    {site.bookingApprovalModel !== 'auto' && (
                      <div className="p-3 border rounded-xl bg-amber-500/5 border-amber-500/10 text-xs font-semibold text-amber-700 flex items-start gap-2">
                        <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <Badge variant="outline" className="text-[9px] bg-amber-100 border-amber-200 text-amber-700 uppercase h-4 font-bold tracking-wider mb-1">
                            Manual Review
                          </Badge>
                          <p className="text-[11px] leading-relaxed">
                            Approval policy: This site requires manual authorization by the asset owner before flight confirmation.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Asset Access Fee</span>
                        <span>{formatMoney(checkoutContext.pricing.assetManagerFee, checkoutContext.pricing.currency)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Service Platform Fee</span>
                        <span>{formatMoney(checkoutContext.pricing.platformFee, checkoutContext.pricing.currency)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-primary pt-2 border-t mt-1">
                        <span>Total Due Now</span>
                        <span>{formatMoney(checkoutContext.pricing.totalDueNow, checkoutContext.pricing.currency)}</span>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>



              {/* Emergency Recovery warning label checkbox */}
              {operationType === 'emergency' && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10">
                  <Checkbox
                    checked={emergencyAuthAgreed}
                    onCheckedChange={(val) => setEmergencyAuthAgreed(!!val)}
                    className="mt-0.5 border-amber-500"
                  />
                  <span className="text-[11px] leading-relaxed text-amber-800 font-medium">
                    I authorize VertiAccess to charge the standby recovery fee only if an emergency landing is executed, or usage is validated.
                  </span>
                </label>
              )}
            </div>
          )}

        </div>

        {/* Wizard Navigation Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur flex justify-end gap-3 z-30">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            className="w-auto px-5 h-9 text-xs font-bold"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            type="button"
            onClick={currentStep === 4 ? handleConfirmBooking : nextStep}
            disabled={isNextDisabled() || isSubmittingBooking}
            className="w-auto px-6 h-9 text-xs font-bold"
          >
            {isSubmittingBooking ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Submitting...
              </>
            ) : currentStep === 4 ? (
              'Confirm Booking'
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>

      {/* Right side: Map container */}
      <div className="hidden lg:block lg:w-[55%] sticky top-16 h-[calc(100vh-84px)] bg-muted">
        <InfrastructureDetailMap
          sites={totalSitesList}
          activeSiteId={siteId}
          onSiteSelect={() => {}}
          className="h-full"
        />
      </div>
    </div>
  )
}
