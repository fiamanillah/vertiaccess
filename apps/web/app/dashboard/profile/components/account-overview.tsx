'use client'

import * as React from 'react'
import { User as UserIcon, Edit2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Label } from '@workspace/ui/components/label'
import { Input } from '@workspace/ui/components/input'
import { toast } from 'sonner'
import { authService } from '@/services/auth/auth.service'
import { useAuthStore } from '@/store/use-auth-store'

interface AccountOverviewProps {
  user: {
    name: string
    email: string
    organisation: string
    accountType: string
    accountId: string
    verificationStatus?: string
    flyerId?: string
    operatorId?: string
  }
}

export function AccountOverview({ user: initialUser }: AccountOverviewProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [userData, setUserData] = React.useState(initialUser)
  const [prevInitialUser, setPrevInitialUser] = React.useState(initialUser)

  const { user, setUser } = useAuthStore()

  // Sync state when initialUser changes (only if not currently editing)
  if (initialUser !== prevInitialUser) {
    setPrevInitialUser(initialUser)
    if (!isEditing) {
      setUserData(initialUser)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      // Split name back into first and last
      const nameParts = userData.name.trim().split(/\s+/)
      const firstName = nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

      if (!firstName || !lastName) {
        toast.error('Please enter both first and last name')
        setIsSaving(false)
        return
      }

      const response = await authService.updateProfile({
        fullName: userData.name,
        organisation: userData.organisation,
        // Optional: flyerId and operatorId if they were editable here
      })

      if (response.success) {
        // Update local store
        setUser({
          ...user,
          firstName,
          lastName,
          organisation: userData.organisation,
        })
        setIsEditing(false)
        toast.success('Profile updated successfully')
      } else {
        toast.error(response.message || 'Failed to update profile')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setUserData(initialUser)
    setIsEditing(false)
  }

  const getStatusBadge = () => {
    const status = initialUser.verificationStatus || 'UNVERIFIED'
    
    switch (status) {
      case 'VERIFIED':
      case 'APPROVED':
        return (
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2.5 h-6"
          >
            <CheckCircle2 className="size-3 mr-1.5" />
            Verified
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge
            variant="outline"
            className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold px-2.5 h-6"
          >
            <XCircle className="size-3 mr-1.5" />
            Rejected
          </Badge>
        )
      case 'PENDING':
      default:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20 text-[10px] font-bold px-2.5 h-6"
          >
            <div className="size-1.5 rounded-full bg-yellow-500 animate-pulse mr-2" />
            Pending Verification
          </Badge>
        )
    }
  }

  return (
    <Card className="lg:col-span-2 transition-all duration-300 p-0 pb-2">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/30 p-6">
        <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">
          Account Overview
        </CardTitle>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 text-xs"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-xs"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 gap-2 text-xs font-bold shadow-sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
          <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0 border">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-1">
          <div className="space-y-2.5">
            <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
              Full Name
            </Label>
            {isEditing ? (
              <Input
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                className="h-9 text-sm "
              />
            ) : (
              <p className="font-semibold text-sm tracking-tight">
                {userData.name}
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
              Email Address
            </Label>
            <p className="font-semibold text-sm tracking-tight text-muted-foreground/80">
              {userData.email}
            </p>
          </div>

          <div className="space-y-2.5">
            <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
              Organisation
            </Label>
            {isEditing ? (
              <Input
                value={userData.organisation === 'Not Provided' ? '' : userData.organisation}
                onChange={(e) =>
                  setUserData({ ...userData, organisation: e.target.value })
                }
                className="h-9 text-sm "
              />
            ) : (
              <p className="font-semibold text-sm tracking-tight">
                {userData.organisation}
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
              Account Type
            </Label>
            <p className="font-semibold text-sm tracking-tight capitalize">
              {userData.accountType}
            </p>
          </div>

          <div className="space-y-2.5">
            <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
              Verification Status
            </Label>
            <div className="flex items-center">
              {getStatusBadge()}
            </div>
          </div>

          <div className="space-y-2.5">
            <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
              Account ID
            </Label>
            <p className="font-mono text-[11px] font-bold bg-muted/60 px-2 py-1 rounded w-fit border border-muted-foreground/10 text-muted-foreground tracking-tighter uppercase">
              {userData.accountId}
            </p>
          </div>

          {userData.flyerId && (
            <div className="space-y-2.5">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
                Flyer ID
              </Label>
              <p className="font-mono text-[11px] font-bold bg-muted/60 px-2 py-1 rounded w-fit border border-muted-foreground/10 text-muted-foreground tracking-tighter uppercase">
                {userData.flyerId}
              </p>
            </div>
          )}

          {userData.operatorId && (
            <div className="space-y-2.5">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
                Operator ID
              </Label>
              <p className="font-mono text-[11px] font-bold bg-muted/60 px-2 py-1 rounded w-fit border border-muted-foreground/10 text-muted-foreground tracking-tighter uppercase">
                {userData.operatorId}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
