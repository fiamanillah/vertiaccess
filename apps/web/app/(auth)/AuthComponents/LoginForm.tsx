'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { authService } from '@/services/auth/auth.service'
import { useAuthStore } from '@/store/use-auth-store'
import { ApiError } from '@/services/api-client'

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean().default(false).optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const setAuth = useAuthStore((state) => state.setAuth)

  async function onSubmit(data: FormValues) {
    setIsLoading(true)
    try {
      const loginRes = await authService.login({
        email: data.email,
        password: data.password,
      })

      if (loginRes.success) {
        // Fetch full profile
        const profileRes = await authService.getCurrentUser(
          loginRes.data.idToken,
        )

        if (profileRes.success) {
          setAuth(loginRes.data, profileRes.data)

          toast.success('Welcome back!', {
            description: "You've successfully logged into your account.",
          })

          // Redirect based on role or to dashboard
          const role = profileRes.data.role?.toLowerCase()
          if (role === 'admin') router.push('/dashboard/admin')
          else if (role === 'assetmanager') router.push('/dashboard/assetmanager')
          else if (role === 'operator') router.push('/dashboard/operator')
          else router.push('/dashboard')
        } else {
          toast.error('Profile fetch failed', {
            description: 'Logged in but could not retrieve your profile.',
          })
        }
      } else {
        toast.error('Login failed', {
          description: loginRes.message || 'Invalid credentials.',
        })
      }
    } catch (error: unknown) {
      // Check for unconfirmed user error
      if (error instanceof ApiError && error.data?.error?.code === 'USER_NOT_CONFIRMED') {
        toast.info('Account verification required', {
          description: 'Please verify your email to continue. We have sent you a new code.',
        })
        
        // Save email for OTP page and trigger resend
        sessionStorage.setItem('pending_verification_email', data.email)
        try {
          await authService.resendConfirmationCode(data.email)
        } catch (resendError) {
          console.error('Failed to auto-resend code:', resendError)
        }
        
        router.push('/verify-otp')
        return
      }

      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred.'
      toast.error('Login failed', {
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Login
          </CardTitle>
          <CardDescription>
            Enter your email and password to access your account
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
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center justify-between">
                      <FieldLabel>Password <span className="text-destructive">*</span></FieldLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary hover:underline underline-offset-4 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={isLoading}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="rememberMe"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                )}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <p className="px-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="underline underline-offset-4 hover:text-primary transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
