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
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@workspace/ui/components/input-group';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

const formSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters.')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
            .regex(/[0-9]/, 'Password must contain at least one number.')
            .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
        confirmPassword: z.string().min(1, 'Please confirm your password.'),
    })
    .refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type FormValues = z.infer<typeof formSchema>;

export default function ResetPasswordForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const password = form.watch('password');

    const getPasswordStrength = (pass: string) => {
        let score = 0;
        if (!pass) return score;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[a-z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    };

    const strength = getPasswordStrength(password);

    async function onSubmit(data: FormValues) {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);

        toast.success('Password reset successful!', {
            description: 'You can now log in with your new password.',
        });

        // Clear all recovery state
        sessionStorage.removeItem('forgot_password_email');
        sessionStorage.removeItem('forgot_password_verified');
        
        router.push('/login');
    }

    return (
        <div className="flex flex-col gap-6">
            <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Set New Password</CardTitle>
                    <CardDescription>
                        Please choose a strong password that you haven&apos;t used before.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FieldGroup className="gap-4">
                            <Controller
                                name="password"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>New Password</FieldLabel>
                                        <InputGroup>
                                            <InputGroupInput
                                                {...field}
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                autoComplete="new-password"
                                                disabled={isLoading}
                                            />
                                            <InputGroupAddon align="inline-end">
                                                <InputGroupButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    disabled={isLoading}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </InputGroupButton>
                                            </InputGroupAddon>
                                        </InputGroup>
                                        
                                        {/* Strength meter */}
                                        <div className="mt-2 flex h-1 gap-1">
                                            {[1, 2, 3, 4, 5].map(level => (
                                                <div
                                                    key={level}
                                                    className={cn(
                                                        'h-full flex-1 rounded-full transition-colors duration-300',
                                                        level <= strength
                                                            ? strength <= 2 ? 'bg-red-500' : strength <= 4 ? 'bg-yellow-500' : 'bg-emerald-500'
                                                            : 'bg-muted'
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="confirmPassword"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Confirm Password</FieldLabel>
                                        <Input
                                            {...field}
                                            type="password"
                                            placeholder="••••••••"
                                            disabled={isLoading}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <Button type="submit" className="w-full mt-2" size="lg" disabled={isLoading}>
                                {isLoading ? 'Updating password...' : 'Reset Password'}
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
