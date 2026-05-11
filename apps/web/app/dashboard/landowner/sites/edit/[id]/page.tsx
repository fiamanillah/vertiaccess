'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@workspace/ui/components/button';
import { ArrowLeft, Construction } from 'lucide-react';

import { FormStepper } from '../../add/components/form-stepper';
import { SiteInformationForm } from '../../add/components/site-information-form';
import { SiteLocationForm } from '../../add/components/site-location-form';
import { SitePolicyForm } from '../../add/components/site-policy-form';
import { SiteCommercialForm } from '../../add/components/site-commercial-form';
import { SiteAuthorityForm } from '../../add/components/site-authority-form';
import { SiteReviewForm } from '../../add/components/site-review-form';

import { formSchema, type FormValues } from '../../schema';
import { AlertTriangle, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';

const steps = [
    { id: 1, title: 'Information', description: 'Basic site details' },
    { id: 2, title: 'Location', description: 'Boundaries & coordinates' },
    { id: 3, title: 'Operational Policy', description: 'Rules & availability' },
    { id: 4, title: 'Commercial Setup', description: 'Pricing & earnings' },
    { id: 5, title: 'Proof of Authority', description: 'Legal land rights' },
    { id: 6, title: 'Review', description: 'Confirm and submit' },
];

export default function EditSitePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const siteId = params.id;
    const [currentStep, setCurrentStep] = React.useState(1);
    const [maxStepReached, setMaxStepReached] = React.useState(1);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        setMaxStepReached(prev => Math.max(prev, currentStep));
    }, [currentStep]);

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
    });

    // Mock data fetching
    const [siteStatus, setSiteStatus] = React.useState<'active' | 'pending' | 'rejected'>('active');
    
    React.useEffect(() => {
        // Load mock data based on ID
        if (siteId === '2') {
            setSiteStatus('pending');
            setMaxStepReached(6);
            form.reset({
                name: 'Surrey Hills Emergency Pad', category: 'Rural Support', siteType: 'emergency',
                description: 'Large open field suitable for emergency and recovery operations.',
                photoUrls: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'],
                contactEmail: 'farm.manager@surreyhills.com', contactPhone: '01483 123456',
                address: 'Old Farm Lane, Guildford', postcode: 'GU2 7XW', latitude: 51.236, longitude: -0.570,
                toalGeometryMode: 'circle', toalRadius: 50, toalPolygonPoints: [],
                allowEmergencyLanding: true, emergencyGeometryMode: 'circle', emergencyRadius: 500, emergencyPolygonPoints: [],
                isPermanentActivation: false, activationStartDate: '2024-06-01', activationEndDate: '2024-08-31', activationStartTime: '08:00', activationEndTime: '20:00',
                bookingApprovalModel: 'auto', policyDocuments: [],
                toalFee: 45.00, emergencyFee: 150.00, ownershipDocuments: ['https://example.com/doc1.pdf'], legalDeclaration: true,
            });
        } else if (siteId === '3') {
            setSiteStatus('pending');
            setMaxStepReached(6);
            form.reset({
                name: 'Surrey Hills Emergency Pad', category: 'Rural Support', siteType: 'emergency',
                description: 'Large open field suitable for emergency and recovery operations.',
                photoUrls: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'],
                contactEmail: 'farm.manager@surreyhills.com', contactPhone: '01483 123456',
                address: 'Old Farm Lane, Guildford', postcode: 'GU2 7XW', latitude: 51.236, longitude: -0.570,
                toalGeometryMode: 'circle', toalRadius: 50, toalPolygonPoints: [],
                allowEmergencyLanding: true, emergencyGeometryMode: 'circle', emergencyRadius: 500, emergencyPolygonPoints: [],
                isPermanentActivation: false, activationStartDate: '2024-06-01', activationEndDate: '2024-08-31', activationStartTime: '08:00', activationEndTime: '20:00',
                bookingApprovalModel: 'auto', policyDocuments: [],
                toalFee: 45.00, emergencyFee: 150.00, ownershipDocuments: ['https://example.com/doc1.pdf'], legalDeclaration: true,
            });
        } else if (siteId === '3') {
            setSiteStatus('rejected');
            setMaxStepReached(6);
            form.reset({
                name: 'Manchester City Vertiport', category: 'Urban Operations', siteType: 'toal',
                description: 'Rooftop vertiport serving the Greater Manchester area.',
                photoUrls: [], contactEmail: 'admin@mcr-vertiport.co.uk', contactPhone: '0161 987 6543',
                address: 'Deansgate, Manchester', postcode: 'M3 4LQ', latitude: 53.477, longitude: -2.253,
                toalGeometryMode: 'polygon', toalRadius: 75, toalPolygonPoints: [[53.477, -2.253], [53.478, -2.253], [53.478, -2.252], [53.477, -2.252]],
                allowEmergencyLanding: false, emergencyGeometryMode: 'circle', emergencyRadius: 350, emergencyPolygonPoints: [],
                isPermanentActivation: true, bookingApprovalModel: 'manual', policyDocuments: ['https://example.com/mcr-safety.pdf', 'https://example.com/mcr-ops.pdf'],
                toalFee: 85.00, emergencyFee: 0.00, ownershipDocuments: ['https://example.com/doc1.pdf'], legalDeclaration: true,
            });
        } else {
            // Default fallback for any other ID
            setSiteStatus('active');
            setMaxStepReached(6);
            form.reset({
                name: 'Canary Wharf Helipad (Mock)', category: 'Urban Operations', siteType: 'toal',
                description: 'Prime urban operations pad located in the heart of the financial district.',
                photoUrls: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80'],
                contactEmail: 'ops@canarywharfheli.com', contactPhone: '020 7123 4567',
                address: 'South Quay, London', postcode: 'E14 9SH', latitude: 51.502, longitude: -0.019,
                toalGeometryMode: 'circle', toalRadius: 100, toalPolygonPoints: [],
                allowEmergencyLanding: true, emergencyGeometryMode: 'circle', emergencyRadius: 350, emergencyPolygonPoints: [],
                isPermanentActivation: true, bookingApprovalModel: 'manual', policyDocuments: ['https://example.com/doc1.pdf'],
                toalFee: 125.00, emergencyFee: 400.00, ownershipDocuments: ['https://example.com/doc1.pdf'], legalDeclaration: true,
            });
        }
    }, [siteId, form]);

    const nextStep = async () => {
        const step1Fields = ['name', 'category', 'siteType', 'contactEmail', 'contactPhone'];
        const step2Fields = ['address', 'postcode'];
        const step3Fields = [
            'activationStartDate',
            'activationStartTime',
            'activationEndDate',
            'activationEndTime',
            'isPermanentActivation',
            'bookingApprovalModel'
        ];
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
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);

        toast.success('Site application submitted!', {
            description: `${data.name} is now under review by our safety team.`,
        });
        router.push('/dashboard/landowner/sites');
    }

    const currentStepMeta = steps[currentStep - 1];

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Page header */}
            <div className="flex items-start gap-4 mb-8">
                <Button
                    variant="ghost"
                    size="icon"
                    className="mt-1 shrink-0 text-muted-foreground hover:text-foreground"
                    asChild
                >
                    <Link href="/dashboard/landowner/sites">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        Edit Site Details
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage your site configuration and operational settings.
                    </p>
                </div>
            </div>

            {siteStatus === 'pending' && (
                <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <AlertTitle className="font-bold">Site In Review</AlertTitle>
                    <AlertDescription className="text-sm mt-1">
                        Your site is currently under review by our team. Editing is disabled to ensure a smooth verification process.
                    </AlertDescription>
                </Alert>
            )}

            {siteStatus === 'rejected' && (
                <Alert className="mb-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <AlertTitle className="font-bold">Application Rejected</AlertTitle>
                    <AlertDescription className="text-sm mt-1">
                        Rejection Reason: The ownership document uploaded was missing a valid signature. Please upload a new document and resubmit.
                    </AlertDescription>
                </Alert>
            )}

            {/* Stepper */}
            <FormStepper
                steps={steps}
                currentStep={currentStep}
                maxStepReached={maxStepReached}
                onStepClick={(stepId) => {
                    setCurrentStep(stepId);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
            />

            {/* Stage content */}
            <div className="mt-6">
                {currentStep === 1 && (
                    <SiteInformationForm
                        form={form}
                        isLoading={isLoading}
                        onNext={nextStep}
                        onCancel={() => router.push('/dashboard/landowner/sites')}
                        isIdentityLocked={siteStatus === 'active'}
                        globalDisabled={siteStatus === 'pending'}
                    />
                )}

                {currentStep === 2 && (
                    <SiteLocationForm
                        form={form}
                        isLoading={isLoading}
                        onNext={nextStep}
                        onPrev={prevStep}
                        isLocked={siteStatus === 'active'}
                        globalDisabled={siteStatus === 'pending'}
                    />
                )}

                {currentStep === 3 && (
                    <SitePolicyForm
                        form={form}
                        isLoading={isLoading}
                        onNext={nextStep}
                        onPrev={prevStep}
                        isPolicyDocsLocked={siteStatus === 'active'}
                        globalDisabled={siteStatus === 'pending'}
                    />
                )}

                {currentStep === 4 && (
                    <SiteCommercialForm
                        form={form}
                        isLoading={isLoading}
                        onNext={nextStep}
                        onPrev={prevStep}
                        globalDisabled={siteStatus === 'pending'}
                    />
                )}

                {currentStep === 5 && (
                    <SiteAuthorityForm
                        form={form}
                        isLoading={isLoading}
                        onNext={nextStep}
                        onPrev={prevStep}
                        isLocked={siteStatus === 'active'}
                        globalDisabled={siteStatus === 'pending'}
                    />
                )}

                {currentStep === 6 && (
                    <SiteReviewForm
                        form={form}
                        isLoading={isLoading}
                        onSubmit={form.handleSubmit(onSubmit)}
                        onPrev={prevStep}
                        onJumpToStep={(step) => setCurrentStep(step)}
                        editModeStatus={siteStatus}
                    />
                )}
            </div>
        </div>
    );
}
