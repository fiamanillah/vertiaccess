'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@workspace/ui/components/button';
import { ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';

import { SiteInformationForm } from '../../add/components/site-information-form';
import { SiteLocationForm } from '../../add/components/site-location-form';
import { SitePolicyForm } from '../../add/components/site-policy-form';
import { SiteCommercialForm } from '../../add/components/site-commercial-form';
import { SiteAuthorityForm } from '../../add/components/site-authority-form';
import { SiteReviewForm } from '../../add/components/site-review-form';

import { formSchema, type FormValues } from '../../schema';
import { siteService } from '@/services/site.service';
import { subscriptionService, type SubscriptionPlan } from '@/services/subscription.service';

import { InteractiveMap } from '@/components/map/interactive-map'
import { PreviewMap } from '@/components/map/preview-map'
import type { ActiveBoundary } from '@/components/map/map-types'
import { DEFAULT_CENTER, DEFAULT_TOAL_RADIUS, DEFAULT_EMERGENCY_RADIUS } from '@/components/map/map-types'

const steps = [
    { id: 1, title: 'Information', description: 'Basic asset details' },
    { id: 2, title: 'Location', description: 'Boundaries & coordinates' },
    { id: 3, title: 'Operational Policy', description: 'Rules & availability' },
    { id: 4, title: 'Commercial Setup', description: 'Pricing & earnings' },
    { id: 5, title: 'Proof of Authority', description: 'Legal land rights' },
    { id: 6, title: 'Review', description: 'Confirm and submit' },
];

export default function EditInfrastructureAssetPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const unwrappedParams = React.use(params);
    const siteId = unwrappedParams.id;
    const [currentStep, setCurrentStep] = React.useState(1);
    const [isLoading, setIsLoading] = React.useState(false);
    const [pricingPlans, setPricingPlans] = React.useState<SubscriptionPlan[]>([]);
    const [pricingPlansLoading, setPricingPlansLoading] = React.useState(true);
    const [pricingPlansError, setPricingPlansError] = React.useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: 'all',
        defaultValues: {
            name: '', category: '', siteType: 'toal', description: '', photoUrls: [],
            contactEmail: '', contactPhone: '', address: '', postcode: '',
            latitude: 51.505, longitude: -0.09, toalGeometryMode: 'circle' as const,
            toalRadius: 100, toalPolygonPoints: [], toalAreaM2: undefined,
            allowEmergencyLanding: false, emergencyGeometryMode: 'circle' as const,
            emergencyRadius: 350, emergencyPolygonPoints: [], emergencyAreaM2: undefined,
            activationStartDate: new Date().toISOString().split('T')[0], activationStartTime: '09:00',
            activationEndDate: '', activationEndTime: '17:00', isPermanentActivation: true,
            bookingApprovalModel: 'manual' as const, policyDocuments: [], toalFee: undefined,
            emergencyFee: undefined, ownershipDocuments: [], legalDeclaration: false,
        },
    });

    const siteType = form.watch('siteType')
    const latitude = form.watch('latitude')
    const longitude = form.watch('longitude')
    const mapCenter = { lat: latitude || DEFAULT_CENTER.lat, lng: longitude || DEFAULT_CENTER.lng }
    const toalMode = form.watch('toalGeometryMode') || 'circle'
    const toalRadius = form.watch('toalRadius') || DEFAULT_TOAL_RADIUS
    const toalPts = form.watch('toalPolygonPoints') || []
    const showToal = siteType !== 'emergency'
    const showEmergency = siteType === 'emergency' || (form.watch('allowEmergencyLanding') || false)
    const emergencyMode = form.watch('emergencyGeometryMode') || 'circle'
    const emergencyRadius = form.watch('emergencyRadius') || DEFAULT_EMERGENCY_RADIUS
    const emergencyPts = form.watch('emergencyPolygonPoints') || []

    const [activeBoundary, setActiveBoundary] = React.useState<ActiveBoundary>(
        siteType === 'emergency' ? 'emergency' : 'toal'
    )

    React.useEffect(() => {
        let cancelled = false;
        const loadPricingPlans = async () => {
            setPricingPlansLoading(true);
            setPricingPlansError(null);
            try {
                const response = await subscriptionService.listPlans();
                if (cancelled) return;
                setPricingPlans(response.data ?? []);
            } catch (error) {
                if (cancelled) return;
                setPricingPlans([]);
                setPricingPlansError(error instanceof Error ? error.message : 'Unable to load pricing plans.');
            } finally {
                if (!cancelled) setPricingPlansLoading(false);
            }
        };
        void loadPricingPlans();
        return () => { cancelled = true; };
    }, []);

    function mapBackendSiteToFormValues(s: any): FormValues {
        const geometry = s.geometry || {};
        const clzGeometry = s.clzGeometry || {};

        const toalPolygonPoints = geometry.type === 'polygon' && geometry.points
            ? geometry.points.map((p: any) => [p.lat, p.lng] as [number, number]) : [];

        const emergencyPolygonPoints = clzGeometry.type === 'polygon' && clzGeometry.points
            ? clzGeometry.points.map((p: any) => [p.lat, p.lng] as [number, number]) : [];

        const validityStart = s.validityStart ? new Date(s.validityStart) : new Date();
        let activationStartDate = '';
        let activationStartTime = '09:00';
        const startSplit = validityStart.toISOString().split('T')[0];
        if (startSplit) activationStartDate = startSplit;
        const startTimeSplit = validityStart.toTimeString().split(' ')[0];
        if (startTimeSplit) activationStartTime = startTimeSplit.slice(0, 5);

        let activationEndDate = '';
        let activationEndTime = '17:00';
        if (s.validityEnd) {
            const validityEnd = new Date(s.validityEnd);
            const endSplit = validityEnd.toISOString().split('T')[0];
            if (endSplit) activationEndDate = endSplit;
            const endTimeSplit = validityEnd.toTimeString().split(' ')[0];
            if (endTimeSplit) activationEndTime = endTimeSplit.slice(0, 5);
        }

        const photoUrls = (s.documents || [])
            .filter((doc: any) => doc.documentType === 'photo')
            .map((doc: any) => ({ fileKey: doc.fileKey, fileName: doc.fileName || 'photo.png', fileSize: Number(doc.fileSize) || 0, category: 'SITE_PHOTO', url: doc.downloadUrl || doc.fileKey, }));

        const policyDocuments = (s.documents || [])
            .filter((doc: any) => doc.documentType === 'policy')
            .map((doc: any) => ({ fileKey: doc.fileKey, fileName: doc.fileName || 'policy.pdf', fileSize: Number(doc.fileSize) || 0, category: 'SITE_POLICY', url: doc.downloadUrl || doc.fileKey, }));

        let mappedOwnershipDocuments = (s.documents || [])
            .filter((doc: any) => doc.documentType === 'ownership')
            .map((doc: any) => ({ fileKey: doc.fileKey, fileName: doc.fileName || 'ownership.pdf', fileSize: Number(doc.fileSize) || 0, category: 'SITE_OWNERSHIP', url: doc.downloadUrl || doc.fileKey, }));

        if (s.status === 'ACTIVE' && mappedOwnershipDocuments.length === 0) {
            mappedOwnershipDocuments = [{ fileKey: 'verified_active_site_placeholder', fileName: 'Verified Ownership Proof (Active Site).pdf', fileSize: 1024, category: 'SITE_OWNERSHIP', url: '#', }];
        }

        return {
            name: s.name || '', category: s.siteCategory || '', siteType: s.siteType || 'toal',
            description: s.description || '', photoUrls, contactEmail: s.contactEmail || '',
            contactPhone: s.contactPhone || '', address: s.address || '', postcode: s.postcode || '',
            latitude: geometry.center?.lat ?? 51.505, longitude: geometry.center?.lng ?? -0.09,
            toalGeometryMode: geometry.type || 'circle', toalRadius: geometry.radius || 100,
            toalPolygonPoints, allowEmergencyLanding: !!s.emergencyRecoveryEnabled,
            emergencyGeometryMode: clzGeometry.type || 'circle', emergencyRadius: clzGeometry.radius || 350,
            emergencyPolygonPoints, isPermanentActivation: !s.validityEnd, activationStartDate,
            activationStartTime, activationEndDate, activationEndTime, bookingApprovalModel: s.autoApprove ? 'auto' : 'manual',
            policyDocuments, toalFee: Number(s.toalAccessFee) || 0, emergencyFee: Number(s.clzAccessFee) || 0,
            ownershipDocuments: mappedOwnershipDocuments, legalDeclaration: s.status === 'ACTIVE' ? true : !!s.acceptedAssetManagerDeclaration,
        };
    }

    const [siteStatus, setSiteStatus] = React.useState<'active' | 'pending' | 'rejected'>('active');
    const [rejectionReason, setRejectionReason] = React.useState<string | null>(null);
    
    React.useEffect(() => {
        async function loadSite() {
            try {
                setIsLoading(true);
                const res = await siteService.getSite(siteId);
                if (res.success && res.data) {
                    const s = res.data;
                    let mappedStatus: 'active' | 'pending' | 'rejected' = 'pending';
                    if (s.status === 'ACTIVE') mappedStatus = 'active';
                    else if (s.status === 'REJECTED' || s.status === 'DISABLE' || s.status === 'TEMPORARY_RESTRICTED' || s.status === 'WITHDRAWN') mappedStatus = 'rejected';
                    setSiteStatus(mappedStatus);
                    setRejectionReason(s.rejectionReasonNote || s.adminNote || null);
                    form.reset(mapBackendSiteToFormValues(s));
                }
            } catch (err: any) {
                toast.error('Failed to load asset details', { description: err.message || 'Could not fetch asset details from database.' });
            } finally {
                setIsLoading(false);
            }
        }
        loadSite();
    }, [siteId, form]);

    const nextStep = async () => {
        const step1Fields = ['name', 'category', 'siteType', 'contactEmail', 'contactPhone'];
        const step2Fields = [
            'address',
            'postcode',
            'toalGeometryMode',
            'toalRadius',
            'toalPolygonPoints',
            'allowEmergencyLanding',
            'emergencyGeometryMode',
            'emergencyRadius',
            'emergencyPolygonPoints',
        ];
        const step3Fields = ['activationStartDate', 'activationStartTime', 'activationEndDate', 'activationEndTime', 'isPermanentActivation', 'bookingApprovalModel'];
        const step4Fields = ['toalFee', 'emergencyFee'];

        let fieldsToValidate: string[] = [];
        if (currentStep === 1) fieldsToValidate = step1Fields;
        else if (currentStep === 2) fieldsToValidate = step2Fields;
        else if (currentStep === 3) fieldsToValidate = step3Fields;
        else if (currentStep === 4) fieldsToValidate = step4Fields;
        else if (currentStep === 5) fieldsToValidate = ['ownershipDocuments', 'legalDeclaration'];

        const isValid = await form.trigger(fieldsToValidate as any);
        if (isValid) {
            if (currentStep < steps.length) {
                setCurrentStep(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                (form.handleSubmit(onSubmit) as any)();
            }
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    async function onSubmit(data: FormValues) {
        setIsLoading(true);
        const validityStart = new Date(`${data.activationStartDate}T${data.activationStartTime}`).toISOString();
        const validityEnd = data.isPermanentActivation ? null : data.activationEndDate && data.activationEndTime ? new Date(`${data.activationEndDate}T${data.activationEndTime}`).toISOString() : null;

        const docs = [];
        if (data.photoUrls) docs.push(...data.photoUrls.map(item => ({ fileKey: item.fileKey, fileName: item.fileName, fileSize: String(item.fileSize), documentType: 'photo' as const })));
        if (data.policyDocuments) docs.push(...data.policyDocuments.map(item => ({ fileKey: item.fileKey, fileName: item.fileName, fileSize: String(item.fileSize), documentType: 'policy' as const })));
        if (data.ownershipDocuments) docs.push(...data.ownershipDocuments.map(item => ({ fileKey: item.fileKey, fileName: item.fileName, fileSize: String(item.fileSize), documentType: 'ownership' as const })));

        const toalPoints = data.toalGeometryMode === 'polygon' && data.toalPolygonPoints ? data.toalPolygonPoints.map(p => ({ lat: p[0], lng: p[1] })) : undefined;
        const emergencyPoints = data.allowEmergencyLanding && data.emergencyGeometryMode === 'polygon' && data.emergencyPolygonPoints ? data.emergencyPolygonPoints.map(p => ({ lat: p[0], lng: p[1] })) : undefined;

        const payload: any = {
            description: data.description || '', contactEmail: data.contactEmail, contactPhone: data.contactPhone,
            validityStart, validityEnd, autoApprove: data.bookingApprovalModel === 'auto',
            exclusiveUse: false, emergencyRecoveryEnabled: !!data.allowEmergencyLanding, clzEnabled: !!data.allowEmergencyLanding,
            toalAccessFee: Number(data.toalFee) || 0, clzAccessFee: Number(data.emergencyFee) || 0,
            hourlyRate: 0, cancellationFeePercentage: 0, documents: docs, siteInformation: data.description || '',
            authorizedToGrantAccess: true, acceptedAssetManagerDeclaration: !!data.legalDeclaration,
        };

        if (siteStatus !== 'active') {
            payload.name = data.name; payload.siteType = data.siteType; payload.siteCategory = data.category;
            payload.address = data.address; payload.postcode = data.postcode;
            payload.geometry = { type: data.toalGeometryMode || 'circle', center: { lat: data.latitude || 51.505, lng: data.longitude || -0.09 }, radius: data.toalGeometryMode === 'circle' ? data.toalRadius : undefined, points: toalPoints, };
            payload.clzGeometry = data.allowEmergencyLanding ? { type: data.emergencyGeometryMode || 'circle', center: { lat: data.latitude || 51.505, lng: data.longitude || -0.09 }, radius: data.emergencyGeometryMode === 'circle' ? data.emergencyRadius : undefined, points: emergencyPoints, } : undefined;
        }

        try {
            await siteService.updateSite(siteId, payload);
            const isTransitioning = siteStatus !== 'active';
            toast.success(isTransitioning ? 'Asset application resubmitted!' : 'Asset details updated!', { description: isTransitioning ? `${data.name} has been resubmitted and is under review.` : `${data.name} details have been updated successfully.`, });
            router.push('/dashboard/assetmanager/infrastructure');
        } catch (error: any) {
            toast.error('Failed to update asset', { description: error.message || 'An error occurred during submission.' });
        } finally {
            setIsLoading(false);
        }
    }

    const currentStepMeta = steps[currentStep - 1];

    return (
        <div className="flex w-full min-h-[calc(100vh-84px)] flex-col lg:flex-row">
            {/* ── Left: Form Container ── */}
            <div className="flex-1 lg:w-[45%] lg:flex-none border-r flex flex-col min-w-0">
                <div className="px-6 py-5 border-b bg-muted sticky top-16 z-40 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0" onClick={() => { if (currentStep > 1) { prevStep() } else { router.push('/dashboard/assetmanager/infrastructure') } }}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Step {currentStep} of {steps.length}: {currentStepMeta?.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{currentStepMeta?.description}</p>
                        </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
                    </div>
                </div>

                <div className="flex-1 p-4 sm:p-6 pb-24 lg:pb-12 overflow-y-auto">
                    {siteStatus === 'pending' && (
                        <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200">
                            <Clock className="h-5 w-5 text-amber-500" />
                            <AlertTitle className="font-bold">Asset In Review</AlertTitle>
                            <AlertDescription className="text-sm mt-1">Your infrastructure asset is currently under review by our team. Editing is disabled to ensure a smooth verification process.</AlertDescription>
                        </Alert>
                    )}
                    {siteStatus === 'rejected' && (
                        <Alert className="mb-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <AlertTitle className="font-bold">Application Rejected</AlertTitle>
                            <AlertDescription className="text-sm mt-1">Rejection Reason: {rejectionReason || 'The application was rejected by the safety team. Please review the details below, correct any issues, and resubmit.'}</AlertDescription>
                        </Alert>
                    )}

                    {currentStep === 1 && (
                        <SiteInformationForm form={form} isLoading={isLoading} onNext={nextStep} onCancel={() => router.push('/dashboard/assetmanager/infrastructure')} isIdentityLocked={siteStatus === 'active'} globalDisabled={siteStatus === 'pending'} />
                    )}
                    {currentStep === 2 && (
                        <SiteLocationForm form={form} isLoading={isLoading} onNext={nextStep} onPrev={prevStep} isLocked={siteStatus === 'active'} globalDisabled={siteStatus === 'pending'} activeBoundary={activeBoundary} setActiveBoundary={setActiveBoundary} />
                    )}
                    {currentStep === 3 && (
                        <SitePolicyForm form={form} isLoading={isLoading} onNext={nextStep} onPrev={prevStep} isPolicyDocsLocked={siteStatus === 'active'} globalDisabled={siteStatus === 'pending'} />
                    )}
                    {currentStep === 4 && (
                        <SiteCommercialForm form={form} isLoading={isLoading} plans={pricingPlans} plansLoading={pricingPlansLoading} plansError={pricingPlansError} onNext={nextStep} onPrev={prevStep} globalDisabled={siteStatus === 'pending'} />
                    )}
                    {currentStep === 5 && (
                        <SiteAuthorityForm form={form} isLoading={isLoading} onNext={nextStep} onPrev={prevStep} isLocked={siteStatus === 'active'} globalDisabled={siteStatus === 'pending'} />
                    )}
                    {currentStep === 6 && (
                        <SiteReviewForm form={form} isLoading={isLoading} onSubmit={form.handleSubmit(onSubmit)} onPrev={prevStep} onJumpToStep={(step) => setCurrentStep(step)} editModeStatus={siteStatus} />
                    )}
                </div>
            </div>

            {/* ── Right: Map Container ── */}
            <div className="hidden lg:block lg:w-[55%] sticky top-16 h-[calc(100vh-84px)] bg-muted">
                {currentStep === 2 && siteStatus !== 'active' && siteStatus !== 'pending' ? (
                    <InteractiveMap
                        center={mapCenter}
                        toalRadius={toalRadius}
                        emergencyRadius={emergencyRadius}
                        showToal={showToal}
                        showEmergency={showEmergency}
                        activeBoundary={activeBoundary}
                        toalMode={toalMode as any}
                        emergencyMode={emergencyMode as any}
                        initialToalPolygonPoints={toalPts as any}
                        initialEmergencyPolygonPoints={emergencyPts as any}
                        onActiveBoundaryChange={setActiveBoundary}
                        onCenterChange={(c) => { form.setValue('latitude', c.lat, { shouldValidate: true }); form.setValue('longitude', c.lng, { shouldValidate: true }) }}
                        onToalPolygonChange={(pts) => { form.setValue('toalPolygonPoints', pts as any, { shouldValidate: true }) }}
                        onEmergencyPolygonChange={(pts) => { form.setValue('emergencyPolygonPoints', pts as any, { shouldValidate: true }) }}
                    />
                ) : (
                    <PreviewMap
                        center={mapCenter}
                        toalRadius={toalRadius}
                        emergencyRadius={emergencyRadius}
                        showToal={showToal}
                        showEmergency={showEmergency}
                        toalMode={toalMode as any}
                        emergencyMode={emergencyMode as any}
                        initialToalPolygonPoints={toalPts as any}
                        initialEmergencyPolygonPoints={emergencyPts as any}
                    />
                )}
            </div>
        </div>
    );
}
