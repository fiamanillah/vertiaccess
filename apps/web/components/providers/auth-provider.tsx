'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/use-auth-store'
import { authService } from '@/services/auth/auth.service'
import { getIdToken, clearAuthCookies } from '@/lib/cookies'
import { Command } from 'lucide-react'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setUser, setLoading, isLoading, logout } = useAuthStore()

  // Routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/verify-otp',
    '/',
  ]
  const isPublicRoute = publicRoutes.includes(pathname)

  React.useEffect(() => {
    const initAuth = async () => {
      const token = getIdToken()

      if (!token) {
        setLoading(false)
        if (!isPublicRoute && pathname.startsWith('/dashboard')) {
          router.replace('/login')
        }
        return
      }

      if (!user) {
        try {
          const response = await authService.getCurrentUser(token)
          if (response.success) {
            setUser(response.data)
          } else {
            // Token invalid or user not found
            clearAuthCookies()
            logout()
            if (!isPublicRoute) router.replace('/login')
          }
        } catch (error) {
          console.error('Initial auth check failed:', error)
          clearAuthCookies()
          logout()
          if (!isPublicRoute) router.replace('/login')
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    initAuth()
  }, [pathname, isPublicRoute, router, user, setUser, setLoading, logout])

  // If not loading, not authenticated, and on a protected route, 
  // don't render children to prevent crashes before the redirect effect kicks in.
  const shouldShowChildren = isPublicRoute || (!!user && !isLoading)

  return (
    <>
      {isLoading && !isPublicRoute ? (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Command className="absolute inset-0 m-auto h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">
              Securing your session...
            </p>
          </div>
        </div>
      ) : shouldShowChildren ? (
        children
      ) : null}
    </>
  )
}
