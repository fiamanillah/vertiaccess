'use client'

import * as React from 'react'
import { Info, Plane, ArrowLeft } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/ui/components/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { aircraftService, AircraftDto } from '@/services/aircraft.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/use-auth-store'

export default function AircraftNewRoutePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [isSaving, setIsSaving] = React.useState(false)

  // Form states
  const [name, setName] = React.useState('')
  const [droneModel, setDroneModel] = React.useState('')
  const [manufacturer, setManufacturer] = React.useState('')
  const [airframe, setAirframe] = React.useState<
    'Fixed-Wing' | 'Rotary' | 'Hybrid' | 'Fixed-Wing, Rotary or Hybrid'
  >('Rotary')
  const [mtow, setMtow] = React.useState('')
  const [serialNumber, setSerialNumber] = React.useState('')
  const [registrationNumber, setRegistrationNumber] = React.useState('')
  const [icaoAddress, setIcaoAddress] = React.useState('')

  React.useEffect(() => {
    // If not authenticated, redirect to sign-in or check user
    if (!user) {
      // Allow a brief moment or redirect
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !droneModel || !manufacturer || !airframe || !mtow) {
      toast.error('Please fill in all required fields.')
      return
    }

    const payload: AircraftDto = {
      name,
      droneModel,
      manufacturer,
      airframe,
      mtow,
      serialNumber: serialNumber || null,
      icaoAddress: icaoAddress || null,
      registrationNumber: registrationNumber || null,
    }

    setIsSaving(true)
    try {
      const res = await aircraftService.createAircraft(payload)
      if (res.success) {
        toast.success('Aircraft registered successfully.')
        router.push('/dashboard/operator/aircraft')
      } else {
        toast.error(res.message || 'Failed to register aircraft.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/operator/aircraft')}
            className="rounded-lg h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-muted-foreground">
            Back to Dashboard
          </span>
        </div>

        <Card className="border-border/60 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-bold">Register New Aircraft</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Enter the manual technical asset specifications for your aircraft.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold">
                  Aircraft Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. My DJI Mavic 3 Enterprise"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="manufacturer" className="text-xs font-bold">
                    Manufacturer *
                  </Label>
                  <Input
                    id="manufacturer"
                    placeholder="e.g. DJI, Wingtra"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="droneModel" className="text-xs font-bold">
                    Model *
                  </Label>
                  <Input
                    id="droneModel"
                    placeholder="e.g. Mavic 3 Pro"
                    value={droneModel}
                    onChange={(e) => setDroneModel(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Airframe *</Label>
                  <Select
                    value={airframe}
                    onValueChange={(val) =>
                      setAirframe(val as AircraftDto['airframe'])
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select Airframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed-Wing">Fixed-Wing</SelectItem>
                      <SelectItem value="Rotary">Rotary</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="Fixed-Wing, Rotary or Hybrid">
                        Fixed-Wing, Rotary or Hybrid
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mtow" className="text-xs font-bold">
                    Mass - Minimum Takeoff Weight (MTW) *
                  </Label>
                  <Input
                    id="mtow"
                    placeholder="e.g. 1.05 Kg"
                    value={mtow}
                    onChange={(e) => setMtow(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="serialNumber" className="text-xs font-bold">
                    Serial Number
                  </Label>
                  <Input
                    id="serialNumber"
                    placeholder="Serial No. (Optional)"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="registrationNumber" className="text-xs font-bold">
                    Registration ID
                  </Label>
                  <Input
                    id="registrationNumber"
                    placeholder="Reg No. (Optional)"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="icaoAddress" className="text-xs font-bold">
                  ICAO Address
                </Label>
                <Input
                  id="icaoAddress"
                  placeholder="ICAO Address (Optional)"
                  value={icaoAddress}
                  onChange={(e) => setIcaoAddress(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex gap-2 text-[10px] text-muted-foreground bg-muted/20 p-2.5 border border-border/50 rounded-lg">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>
                  Required fields (*) will autofill the booking form when requesting access to sites.
                </span>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/operator/aircraft')}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? 'Registering...' : 'Register Aircraft'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
