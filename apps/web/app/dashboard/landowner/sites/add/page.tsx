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

import { FormStepper } from './components/form-stepper';
import { SiteInformationForm } from './components/site-information-form';
import { SiteLocationForm } from './components/site-location-form';
import { SitePolicyForm } from './components/site-policy-form';
import { SiteCommercialForm } from './components/site-commercial-form';
import { SiteAuthorityForm } from './components/site-authority-form';
import { SiteReviewForm } from './components/site-review-form';
import { formSchema, type FormValues } from '../schema';

const steps = [
    { id: 1, title: 'Information', description: 'Basic site details' },
    { id: 2, title: 'Location', description: 'Boundaries & coordinates' },
    { id: 3, title: 'Operational Policy', description: 'Rules & availability' },
    { id: 4, title: 'Commercial Setup', description: 'Pricing & earnings' },
    { id: 5, title: 'Proof of Authority', description: 'Legal land rights' },
    { id: 6, title: 'Review', description: 'Confirm and submit' },
];

export default function AddSitePage() {
    const router = useRouter();
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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Register New Site
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Complete the registration process to list your site on the VertiAccess network.
                    </p>
                </div>
            </div>

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
    );
}
