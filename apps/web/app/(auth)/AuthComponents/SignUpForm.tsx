'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
import { authService } from '@/services/auth/auth.service';

const formSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters.'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters.'),
    email: z.string().email('Please enter a valid email address.'),
    organisation: z.string().optional(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters.')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
        .regex(/[0-9]/, 'Password must contain at least one number.')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
    flyerId: z.string().optional(),
    operatorId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SignUpFormProps {
    role: 'landowner' | 'operator';
}

export default function SignUpForm({ role }: SignUpFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            organisation: '',
            password: '',
            flyerId: '',
            operatorId: '',
        },
    });

    const password = useWatch({
        control: form.control,
        name: 'password',
        defaultValue: '',
    });

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

    const getStrengthColor = (score: number) => {
        switch (score) {
            case 0:
                return 'bg-muted';
            case 1:
                return 'bg-red-500';
            case 2:
                return 'bg-orange-500';
            case 3:
                return 'bg-yellow-500';
            case 4:
                return 'bg-green-500';
            case 5:
                return 'bg-emerald-500';
            default:
                return 'bg-muted';
        }
    };

    const getStrengthText = (score: number) => {
        switch (score) {
            case 0:
                return '';
            case 1:
                return 'Weak';
            case 2:
                return 'Fair';
            case 3:
                return 'Good';
            case 4:
                return 'Strong';
            case 5:
                return 'Very Strong';
            default:
                return '';
        }
    };

    async function onSubmit(data: FormValues) {
        // Basic validation for operator fields if role is operator
        if (role === 'operator') {
            if (!data.flyerId) {
                form.setError('flyerId', { message: 'Flyer ID is required for drone operators' });
                return;
            }
            if (!data.operatorId) {
                form.setError('operatorId', {
                    message: 'Operator ID is required for drone operators',
                });
                return;
            }
        }

        setIsLoading(true);
        try {
            const response = await authService.register({
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                password: data.password,
                role: role,
                organisation: data.organisation,
                flyerId: data.flyerId,
                operatorId: data.operatorId,
            });

            if (response.success) {
                // Store email for OTP verification context
                sessionStorage.setItem('pending_verification_email', data.email);

                toast.success('Account created!', {
                    description: `Verification code sent to ${data.email}.`,
                });
                
                router.push('/verify-otp');
            } else {
                toast.error('Registration failed', {
                    description: response.message || 'Something went wrong.',
                });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
            toast.error('Registration failed', {
                description: message,
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {role === 'landowner' ? 'Landowner Signup' : 'Drone Operator Signup'}
                    </CardTitle>
                    <CardDescription>
                        Enter your details below to create your {role} account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form id={`signup-form-${role}`} onSubmit={form.handleSubmit(onSubmit)}>
                        <FieldGroup className="gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Controller
                                    name="firstName"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel>First Name <span className="text-destructive">*</span></FieldLabel>
                                            <Input
                                                {...field}
                                                placeholder="John"
                                                autoComplete="given-name"
                                                disabled={isLoading}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="lastName"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel>Last Name <span className="text-destructive">*</span></FieldLabel>
                                            <Input
                                                {...field}
                                                placeholder="Doe"
                                                autoComplete="family-name"
                                                disabled={isLoading}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </Field>
                                    )}
                                />
                            </div>
                            <Controller
                                name="email"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Email <span className="text-destructive">*</span></FieldLabel>
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
                            <Controller
                                name="organisation"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Organisation</FieldLabel>
                                        <Input
                                            {...field}
                                            placeholder="Company Name"
                                            disabled={isLoading}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            {role === 'operator' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Controller
                                        name="flyerId"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel>Flyer ID (CAA) <span className="text-destructive">*</span></FieldLabel>
                                                <Input
                                                    {...field}
                                                    placeholder="GBR-RP-..."
                                                    disabled={isLoading}
                                                />
                                                {fieldState.invalid && (
                                                    <FieldError errors={[fieldState.error]} />
                                                )}
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name="operatorId"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel>Operator ID (CAA) <span className="text-destructive">*</span></FieldLabel>
                                                <Input
                                                    {...field}
                                                    placeholder="GBR-OP-..."
                                                    disabled={isLoading}
                                                />
                                                {fieldState.invalid && (
                                                    <FieldError errors={[fieldState.error]} />
                                                )}
                                            </Field>
                                        )}
                                    />
                                </div>
                            )}
                            <Controller
                                name="password"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Password <span className="text-destructive">*</span></FieldLabel>
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
                                                    aria-label={
                                                        showPassword
                                                            ? 'Hide password'
                                                            : 'Show password'
                                                    }
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </InputGroupButton>
                                            </InputGroupAddon>
                                        </InputGroup>

                                        {/* Password Strength Meter */}
                                        <div className="mt-2 space-y-1.5">
                                            <div className="flex h-1 gap-1">
                                                {[1, 2, 3, 4, 5].map(level => (
                                                    <div
                                                        key={level}
                                                        className={cn(
                                                            'h-full flex-1 rounded-full transition-colors duration-300',
                                                            level <= strength
                                                                ? getStrengthColor(strength)
                                                                : 'bg-muted'
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold">
                                                <span
                                                    className={cn(
                                                        'transition-colors',
                                                        strength > 0
                                                            ? 'text-foreground'
                                                            : 'text-muted-foreground'
                                                    )}
                                                >
                                                    Strength: {getStrengthText(strength)}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {strength}/5 criteria met
                                                </span>
                                            </div>
                                        </div>

                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                                {isLoading ? 'Creating account...' : 'Create account'}
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <p className="px-8 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                    href="/login"
                    className="underline underline-offset-4 hover:text-primary transition-colors"
                >
                    Login
                </Link>
            </p>
        </div>
    );
}
