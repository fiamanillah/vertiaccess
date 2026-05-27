'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { useAuthStore } from '@/store/use-auth-store'

export default function Page() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex flex-1 flex-col gap-8 max-w-7xl mx-auto p-4">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back, {user?.firstName || 'Admin'}. Manage and monitor the VertiAccess network.
        </p>
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Admin Overview</CardTitle>
          <CardDescription>
            Placeholder page for Admin Overview management and details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </CardContent>
      </Card>
    </div>
  )
}
