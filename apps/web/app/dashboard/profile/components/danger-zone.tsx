'use client'

import * as React from "react"
import { AlertCircle, Loader2, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { toast } from "sonner"

export function DangerZone() {
  const [isDeactivating, setIsDeactivating] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  const handleDeactivate = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDeactivating(true)
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsDeactivating(false)
    setOpen(false)
    toast.error("Account deactivation scheduled", {
      description: "Your account will be deactivated at the end of the billing cycle.",
    })
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <CardTitle>Danger Zone</CardTitle>
        </div>
        <CardDescription>Irreversible actions for your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Deactivate Account</p>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              Your account remains active until the next billing period, then access is disabled.
            </p>
          </div>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-8 text-xs">Deactivate</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertCircle className="size-5" />
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-sm leading-relaxed">
                  This action is permanent and cannot be undone. Once deactivated, you will lose access 
                   to all your sites, data, and active certifications.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 my-2">
                <p className="text-xs text-destructive font-medium flex items-center gap-2">
                  <AlertCircle className="size-3" />
                  Warning: All data will be permanently deleted after 30 days.
                </p>
              </div>
              <AlertDialogFooter className="mt-4 gap-2">
                <AlertDialogCancel asChild>
                  <Button 
                    variant="outline" 
                    className="h-9 text-xs" 
                    disabled={isDeactivating}
                  >
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <Button 
                  variant="destructive" 
                  onClick={handleDeactivate} 
                  disabled={isDeactivating}
                  className="h-9 text-xs font-bold"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deactivate Account
                    </>
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
