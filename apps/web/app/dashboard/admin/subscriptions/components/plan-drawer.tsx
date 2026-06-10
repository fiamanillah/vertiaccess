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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
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
  Loader2,
} from 'lucide-react'

interface PlanFeature {
  id?: string
  name: string
  included: boolean
}

interface PlanDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  plan: any | null
  onSave: (plan: any) => void
  isSaving: boolean
}

export function PlanDrawer({ isOpen, onOpenChange, plan, onSave, isSaving }: PlanDrawerProps) {
  const isCreate = !plan
  const [formData, setFormData] = React.useState<any>(null)
  const [showPriceWarning, setShowPriceWarning] = React.useState(false)
  const [pendingPrice, setPendingPrice] = React.useState<any>(null)
  const [customFeatures, setCustomFeatures] = React.useState<PlanFeature[]>([])

  React.useEffect(() => {
    if (isOpen) {
      if (plan) {
        setFormData({
          id: plan.id,
          name: plan.name,
          billingType: plan.billingType || 'subscription',
          badge: plan.badge || '',
          description: plan.description || '',
          currency: plan.currency || 'GBP',
          monthlyPrice: plan.monthlyPrice || 0,
          annualPrice: plan.annualPrice || 0,
          platformFee: plan.platformFee || 0,
          unitLabel: plan.unitLabel || '',
          isActive: plan.isActive !== false,
          stripeProductId: plan.stripeProductId,
          waivedBookingsLimit: plan.waivedBookingsLimit !== null ? plan.waivedBookingsLimit : undefined,
          limits: plan.limits || { monthlyBookings: undefined },
        })
        setCustomFeatures(
          (plan.customFeatures || []).map((f: any) =>
            typeof f === 'string' ? { name: f, included: true } : { ...f }
          )
        )
      } else {
        setFormData({
          name: '',
          billingType: 'subscription',
          badge: '',
          description: '',
          currency: 'GBP',
          monthlyPrice: 0,
          annualPrice: 0,
          platformFee: 0,
          unitLabel: '/mo',
          isActive: true,
          waivedBookingsLimit: undefined,
          limits: { monthlyBookings: undefined },
        })
        setCustomFeatures([])
      }
    }
  }, [isOpen, plan])

  const handlePriceBlur = (field: string, value: string) => {
    const numValue = Number(value) || 0
    if (formData && !isCreate && numValue !== formData[field]) {
      setPendingPrice({ field, value: numValue })
      setShowPriceWarning(true)
    } else {
      setFormData({ ...formData, [field]: numValue })
    }
  }

  const confirmPriceChange = () => {
    if (pendingPrice) {
      setFormData({ ...formData, [pendingPrice.field]: pendingPrice.value })
    }
    setShowPriceWarning(false)
    setPendingPrice(null)
  }

  const handleSave = () => {
    // Map features array strings to objects if empty
    const sanitizedFeatures = customFeatures.filter(f => f.name.trim() !== '')
    const payload = {
      ...formData,
      customFeatures: sanitizedFeatures,
    }
    onSave(payload)
  }

  const addCustomFeature = () => {
    setCustomFeatures([...customFeatures, { name: '', included: true }])
  }

  const removeCustomFeature = (index: number) => {
    setCustomFeatures(customFeatures.filter((_, idx) => idx !== index))
  }

  const updateCustomFeatureName = (index: number, name: string) => {
    const updated = [...customFeatures]
    const item = updated[index]
    if (item) {
      updated[index] = { ...item, name }
      setCustomFeatures(updated)
    }
  }

  const toggleCustomFeatureIncluded = (index: number) => {
    const updated = [...customFeatures]
    const item = updated[index]
    if (item) {
      updated[index] = { ...item, included: !item.included }
      setCustomFeatures(updated)
    }
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
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
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
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">Identity</h4>
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Billing Type</Label>
                    <Select
                      value={formData.billingType}
                      onValueChange={(val: any) =>
                        setFormData({
                          ...formData,
                          billingType: val,
                          unitLabel: val === 'payg' ? '/booking' : '/mo',
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-muted/5 border-border/60">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="payg">Pay-As-You-Go</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Badge Text</Label>
                    <Input 
                      value={formData.badge} 
                      onChange={e => setFormData({ ...formData, badge: e.target.value })}
                      className="h-8 text-xs bg-muted/5 border-border/60"
                      placeholder="e.g. Popular, Individual"
                    />
                  </div>
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
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">Pricing</h4>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(val: any) => setFormData({ ...formData, currency: val })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-muted/5 border-border/60">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.billingType === 'payg' ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Platform Fee (per booking)</Label>
                    <Input 
                      type="number"
                      className="h-8 text-xs bg-muted/5 border-border/60"
                      value={formData.platformFee}
                      onChange={e => setFormData({ ...formData, platformFee: Number(e.target.value) || 0 })}
                      onBlur={e => handlePriceBlur('platformFee', e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Monthly Price</Label>
                      <Input 
                        type="number"
                        className="h-8 text-xs bg-muted/5 border-border/60"
                        value={formData.monthlyPrice}
                        onChange={e => setFormData({ ...formData, monthlyPrice: Number(e.target.value) || 0 })}
                        onBlur={e => handlePriceBlur('monthlyPrice', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Annual Price</Label>
                      <Input 
                        type="number"
                        className="h-8 text-xs bg-muted/5 border-border/60"
                        value={formData.annualPrice}
                        onChange={e => setFormData({ ...formData, annualPrice: Number(e.target.value) || 0 })}
                        onBlur={e => handlePriceBlur('annualPrice', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Section C: Limits & Feature Gates */}
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-border/10 pb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">Limits & Features</h4>
              </div>

              <div className="grid gap-2.5">
                {formData.billingType === 'subscription' && (
                  <div className="p-2.5 rounded-md border border-border/40 bg-muted/5 space-y-2">
                    <Label className="text-xs">Included Bookings (per month)</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Checkbox 
                          id="unlimited-bookings"
                          checked={formData.limits?.monthlyBookings === undefined}
                          onCheckedChange={(checked) => {
                            setFormData({
                              ...formData,
                              limits: {
                                ...formData.limits,
                                monthlyBookings: checked ? undefined : 10,
                              }
                            })
                          }}
                        />
                        <Label htmlFor="unlimited-bookings" className="text-xs cursor-pointer">Unlimited</Label>
                      </div>
                      {formData.limits?.monthlyBookings !== undefined && (
                        <Input 
                          type="number"
                          className="h-7 w-24 text-xs"
                          value={formData.limits.monthlyBookings}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              limits: {
                                ...formData.limits,
                                monthlyBookings: Number(e.target.value) || 0,
                              }
                            })
                          }
                        />
                      )}
                    </div>
                  </div>
                )}

                {formData.billingType === 'subscription' && (
                  <div className="p-2.5 rounded-md border border-border/40 bg-muted/5 space-y-2">
                    <Label className="text-xs">Waived Service Fee Bookings (per month)</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Checkbox 
                          id="unlimited-waived-bookings"
                          checked={formData.waivedBookingsLimit === undefined}
                          onCheckedChange={(checked) => {
                            setFormData({
                              ...formData,
                              waivedBookingsLimit: checked ? undefined : 5,
                            })
                          }}
                        />
                        <Label htmlFor="unlimited-waived-bookings" className="text-xs cursor-pointer">Unlimited</Label>
                      </div>
                      {formData.waivedBookingsLimit !== undefined && (
                        <Input 
                          type="number"
                          className="h-7 w-24 text-xs"
                          value={formData.waivedBookingsLimit}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              waivedBookingsLimit: Number(e.target.value) >= 0 ? Number(e.target.value) : 0,
                            })
                          }
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 p-2.5 rounded-md border border-border/40 bg-muted/5 cursor-pointer" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                  <Checkbox checked={formData.isActive} className="mt-0.5" />
                  <div className="grid gap-0.5">
                    <Label className="text-xs cursor-pointer">Active / Visible</Label>
                    <p className="text-xs text-muted-foreground">Make this plan visible on user pricing desks.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-muted-foreground">Plan Highlight Features</h5>
                  <Button variant="ghost" size="sm" onClick={addCustomFeature} className="h-6 text-xs px-2">
                    <Plus className="h-3 w-3 mr-1" /> Add Feature
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {customFeatures.map((feat, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Checkbox 
                        checked={feat.included}
                        onCheckedChange={() => toggleCustomFeatureIncluded(i)}
                      />
                      <Input 
                        value={feat.name} 
                        onChange={e => updateCustomFeatureName(i, e.target.value)}
                        className="h-8 text-xs bg-muted/5 border-border/40"
                        placeholder="e.g. Priority Support, Custom Dashboard"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeCustomFeature(i)}
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
            <Button variant="ghost" size="sm" className="flex-1 text-xs h-9" disabled={isSaving} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" className="flex-1 text-xs h-9" disabled={isSaving} onClick={handleSave}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                isCreate ? 'Create Tier' : 'Save Changes'
              )}
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
                <span className="text-xs text-muted-foreground leading-tight">Keep current users on their existing billing rate.</span>
             </Button>
             <Button variant="outline" size="sm" className="h-auto p-2 text-left flex flex-col items-start gap-0.5 border-destructive/20 hover:bg-destructive/10" onClick={confirmPriceChange}>
                <span className="text-xs font-semibold text-destructive">Force Migration</span>
                <span className="text-xs text-muted-foreground leading-tight">Update all subscribers to the new price rate.</span>
             </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full text-xs h-8" onClick={() => setPendingPrice(null)}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
