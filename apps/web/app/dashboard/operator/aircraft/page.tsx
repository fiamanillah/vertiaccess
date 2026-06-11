'use client'

import * as React from 'react'
import { Plus, Edit2, Trash2, ShieldAlert, Plane, Wrench } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
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
import { AircraftFormDialog } from './components/aircraft-form-dialog'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'

export default function AircraftPage() {
  const router = useRouter()
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

  // Form states (used for editing)
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

  const openAddPage = () => {
    router.push('/dashboard/operator/aircraft/new')
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
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8  mx-auto">
      <AircraftHeader onAdd={openAddPage} />

      {error ? (
        <AircraftErrorState error={error} onRetry={fetchAircrafts} />
      ) : !isLoading && aircrafts.length === 0 ? (
        <AircraftEmptyState onAdd={openAddPage} />
      ) : (
        <AircraftTable
          aircrafts={aircrafts}
          isLoading={isLoading}
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
        <h1 className="text-2xl font-bold tracking-tight">Aircraft</h1>
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

function AircraftTable({
  aircrafts,
  isLoading,
  onEdit,
  onDelete,
}: {
  aircrafts: AircraftDto[]
  isLoading: boolean
  onEdit: (aircraft: AircraftDto) => void
  onDelete: (aircraft: AircraftDto) => void
}) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const totalRows = aircrafts.length
  const totalPages = Math.max(Math.ceil(totalRows / pagination.pageSize), 1)
  const effectivePageIndex = Math.min(
    pagination.pageIndex,
    Math.max(totalPages - 1, 0),
  )

  const pagedData = React.useMemo(() => {
    return aircrafts.slice(
      effectivePageIndex * pagination.pageSize,
      (effectivePageIndex + 1) * pagination.pageSize,
    )
  }, [aircrafts, effectivePageIndex, pagination.pageSize])

  const columns = React.useMemo<ColumnDef<AircraftDto>[]>(
    () => [
      {
        accessorKey: 'name',
        header: () => <span className="pl-4">Name</span>,
        cell: ({ row }) => (
          <span className="pl-4 font-semibold text-foreground text-xs block">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: 'manufacturer',
        header: 'Manufacturer',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.manufacturer}</span>
        ),
      },
      {
        accessorKey: 'droneModel',
        header: 'Model',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.droneModel}</span>
        ),
      },
      {
        accessorKey: 'airframe',
        header: 'Airframe',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.airframe}</span>
        ),
      },
      {
        accessorKey: 'mtow',
        header: 'Mass - Maximum Takeoff Weight (MTOW)',
        cell: ({ row }) => (
          <span className="text-xs font-medium">{row.original.mtow}</span>
        ),
      },
      {
        accessorKey: 'serialNumber',
        header: 'Serial Number',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.serialNumber || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'registrationNumber',
        header: 'Registration ID',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.registrationNumber || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'icaoAddress',
        header: 'ICAO Address',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.icaoAddress || 'N/A'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right pr-4">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right pr-4 space-x-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg hover:bg-muted"
              onClick={() => onEdit(row.original)}
              aria-label="Edit aircraft"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white border-0 text-red-500"
              onClick={() => onDelete(row.original)}
              aria-label="Delete aircraft"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete],
  )

  return (
    <DataTable
      columns={columns}
      data={pagedData}
      totalRows={totalRows}
      totalPages={totalPages}
      pagination={pagination}
      onPaginationChange={setPagination}
      isLoading={isLoading}
    />
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
