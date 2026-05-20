'use client'

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@workspace/ui/components/sheet'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar'
import { Separator } from '@workspace/ui/components/separator'
import { Input } from '@workspace/ui/components/input'
import { adminService } from '@/services/admin.service'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  AlertCircle,
  ShieldAlert,
  Trash2,
  UserX,
  UserCheck,
  FileText,
  HelpCircle,
  Loader2,
  Coins,
} from 'lucide-react'

interface UserDrawerProps {
  userId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onActionComplete: () => void
}

export function UserDrawer({
  userId,
  isOpen,
  onOpenChange,
  onActionComplete,
}: UserDrawerProps) {
  const [userDetails, setUserDetails] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isActionPending, setIsActionPending] = React.useState(false)

  // Edit / Input states
  const [suspendReason, setSuspendReason] = React.useState<string>('')
  const [showSuspendForm, setShowSuspendForm] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  // Fetch detailed user info on load
  const fetchUserDetails = React.useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const res = await adminService.getUser(userId)
      if (res.success) {
        setUserDetails(res.data)
      } else {
        toast.error(res.message || 'Failed to fetch user details')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while loading user profile')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails()
      // Reset forms
      setShowSuspendForm(false)
      setSuspendReason('')
      setConfirmDelete(false)
    } else {
      setUserDetails(null)
    }
  }, [isOpen, userId, fetchUserDetails])

  const handleSuspend = async () => {
    if (!userId) return
    if (!suspendReason.trim()) {
      toast.warning('Please provide a reason for suspension')
      return
    }
    setIsActionPending(true)
    try {
      const res = await adminService.suspendUser(userId, suspendReason)
      if (res.success) {
        toast.success('Account suspended successfully')
        setShowSuspendForm(false)
        setSuspendReason('')
        fetchUserDetails()
        onActionComplete()
      } else {
        toast.error(res.message || 'Failed to suspend account')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to suspend account')
    } finally {
      setIsActionPending(false)
    }
  }

  const handleReinstate = async () => {
    if (!userId) return
    setIsActionPending(true)
    try {
      const res = await adminService.reinstateUser(userId)
      if (res.success) {
        toast.success('Account reinstated successfully')
        fetchUserDetails()
        onActionComplete()
      } else {
        toast.error(res.message || 'Failed to reinstate account')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reinstate account')
    } finally {
      setIsActionPending(false)
    }
  }

  const handleDelete = async () => {
    if (!userId) return
    setIsActionPending(true)
    try {
      const res = await adminService.deleteUser(userId)
      toast.success('Account deactivated and deleted successfully')
      onOpenChange(false)
      onActionComplete()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account')
    } finally {
      setIsActionPending(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg p-0 flex flex-col h-full border-l shadow-xl bg-card">
        <SheetHeader className="p-6 pb-4 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary animate-pulse" />
            <div>
              <SheetTitle className="text-xl font-bold tracking-tight">
                User details & operations
              </SheetTitle>
              <SheetDescription>
                Detailed overview and admin controls.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm">Fetching user information...</p>
          </div>
        ) : userDetails ? (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Header info */}
            <div className="flex items-start gap-4 mb-6">
              <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md">
                <AvatarImage src="" />
                <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                  {userDetails.firstName[0]}
                  {userDetails.lastName[0]}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h3 className="font-semibold text-lg leading-none">{userDetails.displayName}</h3>
                <p className="text-sm text-muted-foreground">{userDetails.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant={userDetails.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
                    {userDetails.role}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={`capitalize ${
                      userDetails.status === 'active'
                        ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                        : userDetails.status === 'pending_verification'
                        ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                        : userDetails.status === 'suspended'
                        ? 'border-red-500 text-red-500 bg-red-500/10'
                        : 'border-muted-foreground text-muted-foreground bg-muted'
                    }`}
                  >
                    {userDetails.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Profile info block */}
            <div className="space-y-4 mb-6 bg-muted/20 p-4 rounded-xl border border-border/40">
              <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground/80 mb-2">
                Profile details
              </h4>

              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-foreground">
                    {userDetails.firstName} {userDetails.lastName}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="text-foreground truncate">{userDetails.email}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="text-foreground">
                    {userDetails.contactPhone || <span className="text-muted-foreground italic">No phone number</span>}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="text-foreground">
                    {userDetails.organisation || <span className="text-muted-foreground italic">No organisation</span>}
                  </span>
                </div>

                {userDetails.role === 'operator' && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>Flyer ID: </span>
                    <span className="font-mono text-foreground text-xs bg-muted px-1.5 py-0.5 rounded">
                      {userDetails.flyerId || 'N/A'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Joined: </span>
                  <span className="text-foreground">
                    {new Date(userDetails.createdAt).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Block */}
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground/80">
                Platform activity
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card p-3 rounded-lg border border-border/40 text-center shadow-sm">
                  <div className="text-xs text-muted-foreground mb-1">Listed Sites</div>
                  <div className="text-2xl font-bold text-foreground">{userDetails.activity?.sitesCount || 0}</div>
                </div>

                <div className="bg-card p-3 rounded-lg border border-border/40 text-center shadow-sm">
                  <div className="text-xs text-muted-foreground mb-1">Bookings</div>
                  <div className="text-2xl font-bold text-foreground">{userDetails.activity?.bookingsCount || 0}</div>
                </div>

                <div className="bg-card p-3 rounded-lg border border-border/40 text-center shadow-sm">
                  <div className="text-xs text-muted-foreground mb-1">Incidents</div>
                  <div className="text-2xl font-bold text-foreground">{userDetails.activity?.incidentsCount || 0}</div>
                </div>
              </div>
            </div>

            {/* Subscription Block */}
            {userDetails.subscription && (
              <div className="mb-6 bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                  <Coins className="h-4 w-4" />
                  <span>Active monetization plan</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Plan Tier</span>
                    <span className="font-semibold text-foreground text-sm">{userDetails.subscription.planName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Billing Status</span>
                    <Badge variant="outline" className="capitalize border-primary/20 text-primary mt-0.5">
                      {userDetails.subscription.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Admin operations */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground/85 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <span>Administrative Actions</span>
              </h4>

              {/* Action 1: Suspend / Reinstate */}
              <div className="space-y-3 p-4 rounded-xl border border-border/40 bg-muted/5">
                <div className="text-sm font-medium">Account Lockout & Lock Status</div>
                {userDetails.status === 'suspended' ? (
                  <div className="space-y-3">
                    <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-xs text-red-600 flex gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Reason for Suspension:</div>
                        <p className="italic">{userDetails.suspendedReason || 'No reason provided'}</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleReinstate}
                      disabled={isActionPending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Reinstate User Account</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Temporarily lock user credentials, cancel billing renewals, and block access to operator/landowner dashboards immediately.
                    </p>
                    {!showSuspendForm ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowSuspendForm(true)}
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
                      >
                        <UserX className="h-4 w-4" />
                        <span>Suspend Account</span>
                      </Button>
                    ) : (
                      <div className="space-y-2 pt-2 border-t border-border/40">
                        <Input
                          placeholder="Reason for suspension (required)"
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleSuspend}
                            disabled={isActionPending || !suspendReason.trim()}
                            className="flex-1"
                          >
                            Confirm Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowSuspendForm(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action 2: Deactivate & Delete */}
              <div className="space-y-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                <div className="text-sm font-semibold text-destructive">Deactivate & Purge</div>
                <p className="text-xs text-muted-foreground">
                  Permanently disable and soft-delete user records. This action blocks sign-ins globally and removes profiles from user lists.
                </p>

                {!confirmDelete ? (
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Deactivate Account</span>
                  </Button>
                ) : (
                  <div className="space-y-2 bg-background p-3 rounded-lg border border-destructive/40 text-center">
                    <p className="text-xs font-semibold text-destructive">
                      Are you absolutely sure? This cannot be undone.
                    </p>
                    <div className="flex gap-2 justify-center mt-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isActionPending}
                        className="px-4"
                      >
                        Yes, Deactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDelete(false)}
                        className="px-4"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground gap-3">
            <HelpCircle className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-sm">No user selected</p>
          </div>
        )}

        <SheetFooter className="p-4 border-t border-border/40 bg-muted/5 flex flex-row items-center justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close Drawer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
