'use client'

import * as React from 'react'
import { Plus, Edit2, Trash2, ShieldAlert, Plane, Wrench } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
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
import { aircraftService, AircraftDto } from '@/services/aircraft.service'
import { toast } from 'sonner'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { AircraftFormDialog } from './components/aircraft-form-dialog'

export default function AircraftPage() {
  const [aircrafts, setAircrafts] = React.useState<AircraftDto[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Dialog states
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
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
    setIsFormOpen(true)
  }

  const openEditDialog = (aircraft: AircraftDto) => {
    setSelectedAircraft(aircraft)
    setName(aircraft.name)
    setDroneModel(aircraft.droneModel)
    setManufacturer(aircraft.manufacturer)
    setAirframe(aircraft.airframe)
    setMtow(aircraft.mtow)
    setSerialNumber(aircraft.serialNumber || '')
    setIcaoAddress(aircraft.icaoAddress || '')
    setRegistrationNumber(aircraft.registrationNumber || '')
    setIsFormOpen(true)
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

    setIsSaving(true)
    try {
      if (selectedAircraft?.id) {
        const res = await aircraftService.updateAircraft(
          selectedAircraft.id,
          payload,
        )
        if (res.success) {
          toast.success('Aircraft updated successfully.')
          setIsFormOpen(false)
          fetchAircrafts()
        } else {
          toast.error(res.message || 'Failed to update aircraft.')
        }
      } else {
        const res = await aircraftService.createAircraft(payload)
        if (res.success) {
          toast.success('Aircraft registered successfully.')
          setIsFormOpen(false)
          fetchAircrafts()
        } else {
          toast.error(res.message || 'Failed to register aircraft.')
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred.')
    } finally {
      setIsSaving(false)
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
        setIsDeleteOpen(false)
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
      <AircraftHeader onAdd={openAddDialog} />

      {isLoading ? (
        <AircraftLoadingState />
      ) : error ? (
        <AircraftErrorState error={error} onRetry={fetchAircrafts} />
      ) : aircrafts.length === 0 ? (
        <AircraftEmptyState onAdd={openAddDialog} />
      ) : (
        <AircraftGrid
          aircrafts={aircrafts}
          onEdit={openEditDialog}
          onDelete={(aircraft) => {
            setSelectedAircraft(aircraft)
            setIsDeleteOpen(true)
          }}
        />
      )}

      <AircraftFormDialog
        isOpen={isFormOpen}
        isSaving={isSaving}
        selectedAircraft={selectedAircraft}
        name={name}
        manufacturer={manufacturer}
        droneModel={droneModel}
        airframe={airframe}
        mtow={mtow}
        serialNumber={serialNumber}
        registrationNumber={registrationNumber}
        icaoAddress={icaoAddress}
        onNameChange={setName}
        onManufacturerChange={setManufacturer}
        onDroneModelChange={setDroneModel}
        onAirframeChange={setAirframe}
        onMtowChange={setMtow}
        onSerialNumberChange={setSerialNumber}
        onRegistrationNumberChange={setRegistrationNumber}
        onIcaoAddressChange={setIcaoAddress}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSave}
      />

      <AircraftDeleteDialog
        isOpen={isDeleteOpen}
        isDeleting={isDeleting}
        aircraftName={selectedAircraft?.name}
        onCancel={() => {
          setSelectedAircraft(null)
          setIsDeleteOpen(false)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function AircraftHeader({ onAdd }: { onAdd: () => void }) {
  return (
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
        onClick={onAdd}
      >
        <Plus className="h-4 w-4" />
        Add Aircraft
      </Button>
    </div>
  )
}

function AircraftLoadingState() {
  return (
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
  )
}

function AircraftErrorState({
  error,
  onRetry,
}: {
  error: string
  onRetry: () => void
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <p className="text-sm font-medium">{error}</p>
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto text-destructive"
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  )
}

function AircraftEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/80 rounded-2xl min-h-[300px] bg-muted/5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Plane className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-sm font-bold text-foreground">
        No aircraft registered
      </h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
        Register your aircraft specs to enable quick auto-filling and compliance
        validation during site bookings.
      </p>
      <Button size="sm" className="mt-4" onClick={onAdd}>
        Add Your First Aircraft
      </Button>
    </div>
  )
}

function AircraftGrid({
  aircrafts,
  onEdit,
  onDelete,
}: {
  aircrafts: AircraftDto[]
  onEdit: (aircraft: AircraftDto) => void
  onDelete: (aircraft: AircraftDto) => void
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {aircrafts.map((aircraft) => (
        <AircraftCard
          key={aircraft.id}
          aircraft={aircraft}
          onEdit={() => onEdit(aircraft)}
          onDelete={() => onDelete(aircraft)}
        />
      ))}
    </div>
  )
}

function AircraftCard({
  aircraft,
  onEdit,
  onDelete,
}: {
  aircraft: AircraftDto
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-lg"
          onClick={onEdit}
          aria-label="Edit aircraft"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white border-0 text-red-500"
          onClick={onDelete}
          aria-label="Delete aircraft"
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
  )
}

function AircraftDeleteDialog({
  isOpen,
  isDeleting,
  aircraftName,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean
  isDeleting: boolean
  aircraftName?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onCancel() : null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
            <Wrench className="h-5 w-5" /> Delete Aircraft
          </DialogTitle>
          <DialogDescription className="text-xs">
            Are you sure you want to delete{' '}
            <strong className="text-foreground">{aircraftName}</strong>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
