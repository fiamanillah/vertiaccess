'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from '@workspace/ui/components/button'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/store/use-auth-store'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert'
import { siteService, type CreateSiteDto } from '@/services/site.service'

import { FormStepper } from './components/form-stepper'
import { SiteInformationForm } from './components/site-information-form'
import { SiteLocationForm } from './components/site-location-form'
import { SitePolicyForm } from './components/site-policy-form'
import { SiteCommercialForm } from './components/site-commercial-form/index'
import { SiteAuthorityForm } from './components/site-authority-form'
import { SiteReviewForm } from './components/site-review-form'
import { formSchema, type FormValues } from '../schema'
import {
  subscriptionService,
  type SubscriptionPlan,
} from '@/services/subscription.service'

const steps = [
  { id: 1, title: 'Information', description: 'Basic asset details' },
  { id: 2, title: 'Location', description: 'Boundaries & coordinates' },
  { id: 3, title: 'Operational Policy', description: 'Rules & availability' },
  { id: 4, title: 'Commercial Setup', description: 'Pricing & earnings' },
  { id: 5, title: 'Proof of Authority', description: 'Legal land rights' },
  { id: 6, title: 'Review', description: 'Confirm and submit' },
]

export default function AddInfrastructureAssetPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isVerified = user?.verified || false
  const [currentStep, setCurrentStep] = React.useState(1)
  const [maxStepReached, setMaxStepReached] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [pricingPlans, setPricingPlans] = React.useState<SubscriptionPlan[]>([])
  const [pricingPlansLoading, setPricingPlansLoading] = React.useState(true)
  const [pricingPlansError, setPricingPlansError] = React.useState<
    string | null
  >(null)

  React.useEffect(() => {
    setMaxStepReached((prev) => Math.max(prev, currentStep))
  }, [currentStep])

  React.useEffect(() => {
    let cancelled = false

    const loadPricingPlans = async () => {
      setPricingPlansLoading(true)
      setPricingPlansError(null)

      try {
        const response = await subscriptionService.listPlans()
        if (cancelled) {
          return
        }

        setPricingPlans(response.data ?? [])
      } catch (error) {
        if (cancelled) {
          return
        }

        setPricingPlans([])
        setPricingPlansError(
          error instanceof Error
            ? error.message
            : 'Unable to load pricing plans.',
        )
      } finally {
        if (!cancelled) {
          setPricingPlansLoading(false)
        }
      }
    }

    void loadPricingPlans()

    return () => {
      cancelled = true
    }
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
      siteType: 'toal',
      description: '',
      photoUrls: [],
      contactEmail: '',
      contactPhone: '',
      address: '',
      postcode: '',
      latitude: 51.505,
      longitude: -0.09,
      toalGeometryMode: 'circle' as const,
      toalRadius: 100,
      toalPolygonPoints: [],
      toalAreaM2: undefined,
      allowEmergencyLanding: false,
      emergencyGeometryMode: 'circle' as const,
      emergencyRadius: 350,
      emergencyPolygonPoints: [],
      emergencyAreaM2: undefined,
      activationStartDate: new Date().toISOString().split('T')[0],
      activationStartTime: '09:00',
      activationEndDate: '',
      activationEndTime: '17:00',
      isPermanentActivation: true,
      bookingApprovalModel: 'manual' as const,
      policyDocuments: [],
      toalFee: 0,
      emergencyFee: 0,
      ownershipDocuments: [],
      legalDeclaration: false,
    },
  })

  const nextStep = async () => {
    const step1Fields = [
      'name',
      'category',
      'siteType',
      'contactEmail',
      'contactPhone',
    ]
    const step2Fields = ['address', 'postcode']
    const step3Fields = [
      'activationStartDate',
      'activationStartTime',
      'activationEndDate',
      'activationEndTime',
      'isPermanentActivation',
      'bookingApprovalModel',
    ]
    const step4Fields = ['toalFee', 'emergencyFee']

    let fieldsToValidate: string[] = []
    if (currentStep === 1) fieldsToValidate = step1Fields
    else if (currentStep === 2) fieldsToValidate = step2Fields
    else if (currentStep === 3) fieldsToValidate = step3Fields
    else if (currentStep === 4) fieldsToValidate = step4Fields
    else if (currentStep === 5)
      fieldsToValidate = ['ownershipDocuments', 'legalDeclaration']

    const isValid = await form.trigger(fieldsToValidate as any)

    if (isValid) {
      if (currentStep < steps.length) {
        setCurrentStep((prev) => prev + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        ;(form.handleSubmit(onSubmit) as any)()
      }
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    // Combine date and time
    const validityStart = new Date(
      `${data.activationStartDate}T${data.activationStartTime}`,
    ).toISOString()
    const validityEnd = data.isPermanentActivation
      ? null
      : data.activationEndDate && data.activationEndTime
        ? new Date(
            `${data.activationEndDate}T${data.activationEndTime}`,
          ).toISOString()
        : null

    // Map documents
    const docs = []
    if (data.photoUrls) {
      docs.push(
        ...data.photoUrls.map((item) => ({
          fileKey: item.fileKey,
          fileName: item.fileName,
          fileSize: String(item.fileSize),
          documentType: 'photo' as const,
        })),
      )
    }
    if (data.policyDocuments) {
      docs.push(
        ...data.policyDocuments.map((item) => ({
          fileKey: item.fileKey,
          fileName: item.fileName,
          fileSize: String(item.fileSize),
          documentType: 'policy' as const,
        })),
      )
    }
    if (data.ownershipDocuments) {
      docs.push(
        ...data.ownershipDocuments.map((item) => ({
          fileKey: item.fileKey,
          fileName: item.fileName,
          fileSize: String(item.fileSize),
          documentType: 'ownership' as const,
        })),
      )
    }

    // Map TOAL polygon points
    const toalPoints =
      data.toalGeometryMode === 'polygon' && data.toalPolygonPoints
        ? data.toalPolygonPoints.map((p) => ({ lat: p[0], lng: p[1] }))
        : undefined

    // Map emergency polygon points
    const emergencyPoints =
      data.allowEmergencyLanding &&
      data.emergencyGeometryMode === 'polygon' &&
      data.emergencyPolygonPoints
        ? data.emergencyPolygonPoints.map((p) => ({ lat: p[0], lng: p[1] }))
        : undefined

    const payload: CreateSiteDto = {
      name: data.name,
      description: data.description || '',
      siteType: data.siteType as 'toal' | 'emergency',
      siteCategory: data.category as any,
      address: data.address,
      postcode: data.postcode,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      geometry: {
        type: data.toalGeometryMode || 'circle',
        center: { lat: data.latitude || 51.505, lng: data.longitude || -0.09 },
        radius:
          data.toalGeometryMode === 'circle' ? data.toalRadius : undefined,
        points: toalPoints,
      },
      clzGeometry: data.allowEmergencyLanding
        ? {
            type: data.emergencyGeometryMode || 'circle',
            center: {
              lat: data.latitude || 51.505,
              lng: data.longitude || -0.09,
            },
            radius:
              data.emergencyGeometryMode === 'circle'
                ? data.emergencyRadius
                : undefined,
            points: emergencyPoints,
          }
        : undefined,
      validityStart,
      validityEnd,
      autoApprove: data.bookingApprovalModel === 'auto',
      exclusiveUse: false,
      emergencyRecoveryEnabled: !!data.allowEmergencyLanding,
      clzEnabled: !!data.allowEmergencyLanding,
      toalAccessFee: Number(data.toalFee) || 0,
      clzAccessFee: Number(data.emergencyFee) || 0,
      hourlyRate: 0,
      cancellationFeePercentage: 0,
      documents: docs,
      siteInformation: data.description || '',
      authorizedToGrantAccess: true,
      acceptedLandownerDeclaration: !!data.legalDeclaration,
    }

    try {
      await siteService.createSite(payload)
      toast.success('Asset application submitted!', {
        description: `${data.name} is now under review by our safety team.`,
      })
      router.push('/dashboard/landowner/infrastructure')
    } catch (error: any) {
      toast.error('Failed to submit asset application', {
        description: error.message || 'An error occurred during submission.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentStepMeta = steps[currentStep - 1]

  if (!isVerified) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 flex flex-col items-center text-center">
        <div className="mb-6 rounded-full bg-amber-50 p-6 dark:bg-amber-950/20">
          <ShieldAlert className="h-12 w-12 text-amber-600" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">
          Action Required
        </h1>
        <p className="text-muted-foreground font-medium mb-8 max-w-md">
          Landowner can not add assets without verifying the account. Please
          complete your identity verification to unlock asset registration.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/landowner/infrastructure">Back to Assets</Link>
          </Button>
          <Button asChild className="font-bold">
            <Link href="/dashboard/profile">Verify Identity Now</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full min-h-[calc(100vh-84px)]">
      {/* ── Left: Stepper Sidebar ── */}
      <aside className="hidden lg:block shrink-0 w-[260px] border-r sticky top-16 self-start h-[calc(100vh-84px)]">
        <div className="h-full bg-card flex flex-col">
          {/* Back + title */}
          <div className="px-4 pt-5 pb-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href="/dashboard/landowner/infrastructure">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                New Asset Registration
              </span>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">
                Step {currentStep} of {steps.length}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="flex-1 overflow-y-auto p-3">
            <FormStepper
              steps={steps}
              currentStep={currentStep}
              maxStepReached={maxStepReached}
              onStepClick={(stepId) => {
                setCurrentStep(stepId)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </div>
        </div>
      </aside>

      {/* ── Right: Form Content ── */}
      <div className="flex-1 min-w-0">
        {/* Page header */}
        <div className="px-4 sm:px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-foreground lg:hidden"
              asChild
            >
              <Link href="/dashboard/landowner/infrastructure">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Register New Infrastructure Asset
              </h1>
              <p className="text-sm text-muted-foreground">
                Complete each step to list your asset on the VertiAccess network.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 sm:p-6 pb-24 lg:pb-12">
          {currentStep === 1 && (
            <SiteInformationForm
              form={form}
              isLoading={isLoading}
              onNext={nextStep}
              onCancel={() => router.push('/dashboard/landowner/infrastructure')}
            />
          )}

          {currentStep === 2 && (
            <SiteLocationForm
              form={form}
              isLoading={isLoading}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 3 && (
            <SitePolicyForm
              form={form}
              isLoading={isLoading}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 4 && (
            <SiteCommercialForm
              form={form}
              isLoading={isLoading}
              plans={pricingPlans}
              plansLoading={pricingPlansLoading}
              plansError={pricingPlansError}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 5 && (
            <SiteAuthorityForm
              form={form}
              isLoading={isLoading}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 6 && (
            <SiteReviewForm
              form={form}
              isLoading={isLoading}
              onSubmit={form.handleSubmit(onSubmit)}
              onPrev={prevStep}
              onJumpToStep={(step) => setCurrentStep(step)}
            />
          )}
        </div>
      </div>

      {/* ── Mobile: Bottom bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {currentStep}
            </div>
            <span className="text-sm font-medium text-foreground">{currentStepMeta?.title}</span>
          </div>
          <div className="flex gap-1">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`h-1.5 w-3 rounded-full transition-colors ${
                  step.id <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
