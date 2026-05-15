'use client'

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@workspace/ui/components/sheet'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Separator } from '@workspace/ui/components/separator'
import { Badge } from '@workspace/ui/components/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog'
import {
  Plus,
  AlertTriangle,
  Trash2,
  Package,
  Target,
  ShieldCheck,
  Zap,
} from 'lucide-react'

interface PlanDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  plan: any | null
  onSave: (plan: any) => void
}

export function PlanDrawer({ isOpen, onOpenChange, plan, onSave }: PlanDrawerProps) {
  const isCreate = !plan
  const [formData, setFormData] = React.useState<any>(null)
  const [showPriceWarning, setShowPriceWarning] = React.useState(false)
  const [pendingPrice, setPendingPrice] = React.useState<string>('')
  const [customFeatures, setCustomFeatures] = React.useState<string[]>([])

  React.useEffect(() => {
    if (isOpen) {
      if (plan) {
        setFormData({ ...plan })
        setCustomFeatures([...(plan.customFeatures || [])])
      } else {
        setFormData({
          name: '',
          badge: '',
          description: '',
          price: 0,
          unit: 'per month',
          features: [],
          isDefault: false,
          maxActiveSites: 10,
          unlimitedSites: false,
          waiveFees: false,
          priorityVerification: false,
          dedicatedManager: false,
          stripeProductId: 'prod_new',
        })
        setCustomFeatures([])
      }
    }
  }, [isOpen, plan])

  const handlePriceBlur = (value: string) => {
    if (formData && !isCreate && Number(value) !== formData.price) {
      setPendingPrice(value)
      setShowPriceWarning(true)
    } else {
      setFormData({ ...formData, price: Number(value) })
    }
  }

  const confirmPriceChange = () => {
    setFormData({ ...formData, price: Number(pendingPrice) })
    setShowPriceWarning(false)
  }

  const handleSave = () => {
    onSave({ ...formData, customFeatures })
    onOpenChange(false)
  }

  if (!formData) return null

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md overflow-y-auto p-0 flex flex-col h-full border-l shadow-none">
          <SheetHeader className="p-4 border-b border-border/40 bg-muted/5">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div>
                <SheetTitle className="text-base font-semibold tracking-tight">
                  {isCreate ? 'Create New Tier' : `Edit Tier: ${formData.name}`}
                </SheetTitle>
                <SheetDescription className="text-[10px] text-muted-foreground mt-0.5">
                  {isCreate ? 'New billing structure' : 'Update plan details'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-20">
            {/* Section A: Identity */}
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-border/10 pb-1">
                <Target className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Identity</h4>
              </div>
              
              <div className="grid gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Plan Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="h-8 text-xs bg-muted/5 border-border/60"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Badge Text</Label>
                  <Input 
                    value={formData.badge} 
                    onChange={e => setFormData({ ...formData, badge: e.target.value })}
                    className="h-8 text-xs bg-muted/5 border-border/60"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[80px] text-xs bg-muted/5 border-border/60 resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Section B: Pricing */}
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-border/10 pb-1">
                <Zap className="h-3.5 w-3.5 text-destructive" />
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pricing</h4>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Monthly Price (£)</Label>
                  <Input 
                    type="number"
                    className="h-8 text-xs bg-muted/5 border-border/60"
                    defaultValue={formData.price}
                    onBlur={e => handlePriceBlur(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cycle</Label>
                  <Input value={formData.unit} disabled className="h-8 text-xs bg-muted/5 opacity-50 cursor-not-allowed border-border/40" />
                </div>
              </div>
            </section>

            {/* Section C: Feature Gates */}
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-border/10 pb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Feature Gates</h4>
              </div>

              <div className="grid gap-2.5">
                <div className="flex items-start gap-2.5 p-2.5 rounded-md border border-border/40 bg-muted/5 cursor-pointer" onClick={() => setFormData({ ...formData, waiveFees: !formData.waiveFees })}>
                  <Checkbox checked={formData.waiveFees} className="mt-0.5" />
                  <div className="grid gap-0.5">
                    <Label className="text-xs cursor-pointer">Waive Booking Fees</Label>
                    <p className="text-[10px] text-muted-foreground">£0 platform fees per booking.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-md border border-border/40 bg-muted/5 cursor-pointer" onClick={() => setFormData({ ...formData, priorityVerification: !formData.priorityVerification })}>
                  <Checkbox checked={formData.priorityVerification} className="mt-0.5" />
                  <div className="grid gap-0.5">
                    <Label className="text-xs cursor-pointer">Priority Verification</Label>
                    <p className="text-[10px] text-muted-foreground">Auto-prioritize verifications.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-md border border-border/40 bg-muted/5 space-y-2.5">
                  <div className="flex items-start gap-2.5 cursor-pointer" onClick={() => setFormData({ ...formData, unlimitedSites: !formData.unlimitedSites })}>
                    <Checkbox checked={formData.unlimitedSites} className="mt-0.5" />
                    <div className="grid gap-0.5">
                      <Label className="text-xs cursor-pointer">Unlimited Sites</Label>
                      <p className="text-[10px] text-muted-foreground">No limit on site listings.</p>
                    </div>
                  </div>
                  {!formData.unlimitedSites && (
                    <div className="pl-6 flex items-center gap-2">
                      <Label className="text-[10px] text-muted-foreground">Limit:</Label>
                      <Input 
                        type="number" 
                        value={formData.maxActiveSites} 
                        onChange={e => setFormData({ ...formData, maxActiveSites: Number(e.target.value) })}
                        className="h-7 w-20 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-semibold text-muted-foreground">Public Features</h5>
                  <Button variant="ghost" size="sm" onClick={() => setCustomFeatures([...customFeatures, ''])} className="h-6 text-[10px] px-2">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {customFeatures.map((feat, i) => (
                    <div key={i} className="flex gap-1">
                      <Input 
                        value={feat} 
                        onChange={e => {
                          const updated = [...customFeatures]
                          updated[i] = e.target.value
                          setCustomFeatures(updated)
                        }}
                        className="h-8 text-xs bg-muted/5 border-border/40"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setCustomFeatures(customFeatures.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <SheetFooter className="p-4 bg-background border-t border-border/40 flex flex-row gap-2">
            <Button variant="ghost" size="sm" className="flex-1 text-xs h-9" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" className="flex-1 text-xs h-9" onClick={handleSave}>
              {isCreate ? 'Create Tier' : 'Save Changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showPriceWarning} onOpenChange={setShowPriceWarning}>
        <AlertDialogContent className="sm:max-w-xs p-4 rounded-lg">
          <AlertDialogHeader className="items-center text-center">
            <AlertTriangle className="h-5 w-5 text-destructive mb-1" />
            <AlertDialogTitle className="text-base font-semibold text-destructive">Update Pricing?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Choose a strategy for existing subscribers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
             <Button variant="outline" size="sm" className="h-auto p-2 text-left flex flex-col items-start gap-0.5" onClick={confirmPriceChange}>
                <span className="text-xs font-semibold">Grandfather Subscribers</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Keep current users on £{formData?.price?.toFixed(2)}.</span>
             </Button>
             <Button variant="outline" size="sm" className="h-auto p-2 text-left flex flex-col items-start gap-0.5 border-destructive/20 hover:bg-destructive/10" onClick={confirmPriceChange}>
                <span className="text-xs font-semibold text-destructive">Force Migration</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Update all to £{Number(pendingPrice).toFixed(2)}.</span>
             </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full text-xs h-8">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
