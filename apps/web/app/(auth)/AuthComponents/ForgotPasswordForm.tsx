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
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { toast } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
        },
    });

    async function onSubmit(data: FormValues) {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);

        // Store email for verification context
        sessionStorage.setItem('forgot_password_email', data.email);

        toast.success('Reset code sent', {
            description: `We've sent a verification code to ${data.email}.`,
        });
        
        router.push('/forgot-password/verify');
    }

    return (
        <div className="flex flex-col gap-6">
            <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we&apos;ll send you a code to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FieldGroup className="gap-4">
                            <Controller
                                name="email"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Email</FieldLabel>
                                        <Input
                                            {...field}
                                            type="email"
                                            placeholder="m@example.com"
                                            autoComplete="email"
                                            disabled={isLoading}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                                {isLoading ? 'Sending code...' : 'Send Reset Code'}
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <p className="px-8 text-center text-sm text-muted-foreground">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to login
                </Link>
            </p>
        </div>
    );
}
