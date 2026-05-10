'use client'

import * as React from "react"
import { Lock, Loader2, CheckCircle2, ShieldCheck } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { toast } from "sonner"

export function SecuritySettings() {
  const [isEditing, setIsEditing] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsUpdating(false)
    setIsEditing(false)
    toast.success("Password updated successfully", {
      icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />
    })
  }

  return (
    <Card className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Security & Data Management</CardTitle>
        </div>
        <CardDescription>Manage your password and security settings</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Account Password</p>
            <p className="text-xs text-muted-foreground">Password has not been changed yet</p>
          </div>
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => setIsEditing(true)}
            >
              Update
            </Button>
          )}
        </div>

        {isEditing && (
          <form onSubmit={handleUpdatePassword} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" required className="h-9" placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" required className="h-9" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" required className="h-9" placeholder="••••••••" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button 
                type="submit" 
                className="h-9 text-xs font-bold px-4"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="h-9 text-xs px-4"
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
