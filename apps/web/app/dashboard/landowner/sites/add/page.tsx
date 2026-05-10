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

const formSchema = z.object({
    // Stage 1: Site Details
    name: z.string().min(2, 'Site name must be at least 2 characters.'),
    category: z.string().min(1, 'Please select a site category.'),
    siteType: z.string().min(1, 'Please select a primary function.'),
    description: z.string().optional(),
    photoUrls: z.array(z.string()).optional(),
    contactEmail: z.string().email('Please enter a valid email address.'),
    contactPhone: z.string().min(10, 'Please enter a valid contact phone number.'),

    // Stage 2: Location
    address: z.string().min(5, 'Please enter a full address.').optional().or(z.literal('')),
    postcode: z.string().min(5, 'Please enter a valid postcode.').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
    { id: 1, title: 'Information', description: 'Basic site details' },
    { id: 2, title: 'Location', description: 'Boundaries & coordinates' },
    { id: 3, title: 'Financials', description: 'Rates and fees' },
    { id: 4, title: 'Review', description: 'Confirm and submit' },
];

export default function AddSitePage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = React.useState(1);
    const [isLoading, setIsLoading] = React.useState(false);

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
        },
    });

    const nextStep = async () => {
        const fieldsToValidate = currentStep === 1
            ? ['name', 'category', 'siteType', 'contactEmail', 'contactPhone'] as const
            : [] as const;

        const isValid = await form.trigger(fieldsToValidate as any);

        if (isValid) {
            if (currentStep < steps.length) {
                setCurrentStep(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                form.handleSubmit(onSubmit)();
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
            <FormStepper steps={steps} currentStep={currentStep} />

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

                {currentStep > 1 && (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/20 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-5">
                            <Construction className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h2 className="text-lg font-semibold mb-1">
                            {currentStepMeta?.title} — Coming Soon
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-sm mb-8">
                            This stage is currently under development. Go back to review or edit your site information.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={prevStep}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Go Back
                            </Button>
                            <Button
                                onClick={() =>
                                    currentStep < steps.length
                                        ? nextStep()
                                        : form.handleSubmit(onSubmit)()
                                }
                                className="font-semibold"
                            >
                                {currentStep === steps.length ? 'Submit Application' : 'Next Step'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
