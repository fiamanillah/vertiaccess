'use client'

import * as React from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
  Plane,
  Info,
  Wrench,
} from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { aircraftService, AircraftDto } from '@/services/aircraft.service'
import { toast } from 'sonner'
import { Skeleton } from '@workspace/ui/components/skeleton'

export default function AircraftPage() {
  const [aircrafts, setAircrafts] = React.useState<AircraftDto[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Dialog states
  const [isOpen, setIsOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [selectedAircraft, setSelectedAircraft] =
    React.useState<AircraftDto | null>(null)

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

  const fetchAircrafts = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await aircraftService.listAircrafts()
      if (response.success) {
        setAircrafts(response.data)
      } else {
        setError(response.message || 'Failed to retrieve aircraft list.')
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while fetching aircraft.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAircrafts()
  }, [fetchAircrafts])

  const openAddDialog = () => {
    setSelectedAircraft(null)
    setName('')
    setDroneModel('')
    setManufacturer('')
    setAirframe('Rotary')
    setMtow('')
    setSerialNumber('')
    setRegistrationNumber('')
    setIcaoAddress('')
    setIsOpen(true)
  }

  const openEditDialog = (aircraft: AircraftDto) => {
    setSelectedAircraft(aircraft)
    setName(aircraft.name)
    setDroneModel(aircraft.droneModel)
    setManufacturer(aircraft.manufacturer)
    setAirframe(aircraft.airframe)
    setMtow(aircraft.mtow)
    setSerialNumber(aircraft.serialNumber || '')
    setRcaoAddress(aircraft.icaoAddress || '')
    setIegistrationNumber(aircraft.registrationNumber || '')
    setIsOpen(true)
  }

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

    try {
      if (selectedAircraft?.id) {
        const res = await aircraftService.updateAircraft(
          selectedAircraft.id,
          payload,
        )
        if (res.success) {
          toast.success('Aircraft updated successfully.')
          setIsOpen(false)
          fetchAircrafts()
        } else {
          toast.error(res.message || 'Failed to update aircraft.')
        }
      } else {
        const res = await aircraftService.createAircraft(payload)
        if (res.success) {
          toast.success('Aircraft registered successfully.')
          setIsOpen(false)
          fetchAircrafts()
        } else {
          toast.error(res.message || 'Failed to register aircraft.')
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred.')
    }
  }

  const handleDelete = async () => {
    if (!selectedAircraft?.id) return
    setIsDeleting(true)
    try {
      const res = await aircraftService.deleteAircraft(selectedAircraft.id)
      if (res.success) {
        toast.success('Aircraft deleted successfully.')
        setSelectedAircraft(null)
        setIsOpen(false)
        fetchAircrafts()
      } else {
        toast.error(res.message || 'Failed to delete aircraft.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Aircraft Inventory
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Manage your fleet of registered unmanned aerial vehicles (UAVs)
          </p>
        </div>
        <Button
          className="font-semibold text-xs gap-2 shadow-lg shadow-primary/20"
          onClick={openAddDialog}
        >
          <Plus className="h-4 w-4" />
          Add Aircraft
        </Button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="border-border/60">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-destructive"
            onClick={fetchAircrafts}
          >
            Retry
          </Button>
        </div>
      ) : aircrafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/80 rounded-2xl min-h-[300px] bg-muted/5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Plane className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            No aircraft registered
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            Register your aircraft specs to enable quick auto-filling and
            compliance validation during site bookings.
          </p>
          <Button size="sm" className="mt-4" onClick={openAddDialog}>
            Add Your First Aircraft
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {aircrafts.map((aircraft) => (
            <Card
              key={aircraft.id}
              className="border-border/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => openEditDialog(aircraft)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white border-0 text-red-500"
                  onClick={() => {
                    setSelectedAircraft(aircraft)
                    setIsDeleting(true)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <CardHeader className="pb-2.5">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-primary shrink-0" />
                  <CardTitle className="text-sm font-bold leading-tight truncate pr-16">
                    {aircraft.name}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {aircraft.manufacturer} • {aircraft.droneModel}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2.5 text-xs text-muted-foreground">
                <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-2.5">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Airframe
                    </span>
                    <span className="font-semibold text-foreground">
                      {aircraft.airframe}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      MTOW
                    </span>
                    <span className="font-semibold text-foreground">
                      {aircraft.mtow}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Serial Number
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {aircraft.serialNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Registration
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {aircraft.registrationNumber || 'N/A'}
                    </span>
                  </div>
                </div>

                {aircraft.icaoAddress && (
                  <div className="pt-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      ICAO Address
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {aircraft.icaoAddress}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen && !isDeleting} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {selectedAircraft
                ? 'Edit Aircraft Details'
                : 'Register New Aircraft'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter the specification details for the aircraft.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-bold uppercase tracking-wide"
              >
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="manufacturer"
                  className="text-xs font-bold uppercase tracking-wide"
                >
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
                <Label
                  htmlFor="droneModel"
                  className="text-xs font-bold uppercase tracking-wide"
                >
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">
                  Airframe *
                </Label>
                <Select
                  value={airframe}
                  onValueChange={(val: any) => setAirframe(val)}
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
                <Label
                  htmlFor="mtow"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  MTOW (Weight) *
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="serialNumber"
                  className="text-xs font-bold uppercase tracking-wide"
                >
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
                <Label
                  htmlFor="registrationNumber"
                  className="text-xs font-bold uppercase tracking-wide"
                >
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
              <Label
                htmlFor="icaoAddress"
                className="text-xs font-bold uppercase tracking-wide"
              >
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

            <div className="flex gap-2 text-[10px] font-bold text-muted-foreground bg-muted/20 p-2.5 border border-border/50 rounded-lg">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              Required fields (*) will autofill the booking form when requesting
              access to sites.
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Aircraft
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Delete Aircraft
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete{' '}
              <strong className="text-foreground">
                {selectedAircraft?.name}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAircraft(null)
                setIsDeleting(false)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
