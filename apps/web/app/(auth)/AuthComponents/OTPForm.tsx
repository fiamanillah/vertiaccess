'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@workspace/ui/components/field';
import { Button } from '@workspace/ui/components/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from '@workspace/ui/components/input-otp';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

const formSchema = z.object({
    otp: z.string().length(6, 'Verification code must be 6 digits.'),
});

type FormValues = z.infer<typeof formSchema>;

interface OTPFormProps {
    email: string;
}

export default function OTPForm({ email }: OTPFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isResending, setIsResending] = React.useState(false);
    const [countdown, setCountdown] = React.useState(30);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            otp: '',
        },
    });

    // Handle countdown for resend button
    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    async function onSubmit(data: FormValues) {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulating success if OTP is "123456", otherwise error
        if (data.otp === '123456') {
            setIsLoading(false);
            toast.success('Email verified!', {
                description: 'Your account has been successfully verified.',
            });
            // Clear context after success
            sessionStorage.removeItem('pending_verification_email');
            router.push('/dashboard');
        } else {
            setIsLoading(false);
            form.setError('otp', { message: 'Invalid verification code. Try 123456 for testing.' });
            toast.error('Verification failed', {
                description: 'The code you entered is incorrect.',
            });
        }
    }

    async function handleResend() {
        setIsResending(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsResending(false);
        setCountdown(30);
        toast.info('New code sent', {
            description: `We've sent a new verification code to ${email}.`,
        });
    }

    return (
        <div className="flex flex-col gap-6">
            <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">
                        Verify Email
                    </CardTitle>
                    <CardDescription className="text-center">
                        We&apos;ve sent a 6-digit code to{' '}
                        <span className="font-medium text-foreground">{email}</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FieldGroup className="gap-6 flex flex-col items-center">
                            <Controller
                                name="otp"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field
                                        data-invalid={fieldState.invalid}
                                        className="flex flex-col items-center gap-4 w-full"
                                    >
                                        <FieldLabel className="sr-only">
                                            Verification Code
                                        </FieldLabel>
                                        <InputOTP
                                            maxLength={6}
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={isLoading}
                                            containerClassName="justify-center"
                                        >
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                            </InputOTPGroup>
                                            <InputOTPSeparator />
                                            <InputOTPGroup>
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <div className="w-full space-y-4">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    size={'lg'}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Verifying...' : 'Verify Code'}
                                </Button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={countdown > 0 || isResending || isLoading}
                                        className={cn(
                                            'text-sm inline-flex items-center gap-2 transition-colors',
                                            countdown > 0 || isResending
                                                ? 'text-muted-foreground cursor-not-allowed'
                                                : 'text-primary hover:underline underline-offset-4'
                                        )}
                                    >
                                        {isResending && (
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                        )}
                                        Resend code {countdown > 0 && `(${countdown}s)`}
                                    </button>
                                </div>
                            </div>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <div className="text-center">
                <button
                    onClick={() => router.push('/signup')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    Back to signup
                </button>
            </div>
        </div>
    );
}
