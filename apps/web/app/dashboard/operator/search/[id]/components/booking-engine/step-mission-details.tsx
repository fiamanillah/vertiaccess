'use client'

import * as React from 'react'
import {
  Plane,
  ShieldCheck,
  Scale,
  FileType,
  Fingerprint,
  Navigation,
  Info,
  Phone,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import { Button } from '@workspace/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { MissionData } from './types'
import { aircraftService, AircraftDto } from '@/services/aircraft.service'
import { toast } from 'sonner'
import { AircraftFormDialog } from '@/app/dashboard/operator/aircraft/components/aircraft-form-dialog'

interface StepMissionDetailsProps {
  missionData: MissionData
  setMissionData: React.Dispatch<React.SetStateAction<MissionData>>
}

export function StepMissionDetails({
  missionData,
  setMissionData,
}: StepMissionDetailsProps) {
  const [savedAircrafts, setSavedAircrafts] = React.useState<AircraftDto[]>([])
  const [selectedAircraftId, setSelectedAircraftId] = React.useState<string>('')
  const [isLoadingAircrafts, setIsLoadingAircrafts] = React.useState(true)
  const [aircraftError, setAircraftError] = React.useState<string | null>(null)
  const [isAddAircraftOpen, setIsAddAircraftOpen] = React.useState(false)
  const [isSavingAircraft, setIsSavingAircraft] = React.useState(false)

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

  const selectedAircraft = React.useMemo(
    () => savedAircrafts.find((a) => a.id === selectedAircraftId) ?? null,
    [savedAircrafts, selectedAircraftId],
  )

  const fetchAircrafts = React.useCallback(async () => {
    setIsLoadingAircrafts(true)
    setAircraftError(null)
    try {
      const res = await aircraftService.listAircrafts()
      if (res.success) {
        setSavedAircrafts(res.data)
      } else {
        setAircraftError(res.message || 'Failed to load aircraft.')
      }
    } catch (err: any) {
      setAircraftError(err?.message || 'Failed to load aircraft.')
    } finally {
      setIsLoadingAircrafts(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAircrafts()
  }, [fetchAircrafts])

  const handleAircraftSelect = (id: string) => {
    setSelectedAircraftId(id)
    const selected = savedAircrafts.find((a) => a.id === id)
    if (selected) {
      setMissionData((prev) => ({
        ...prev,
        aircraftId: selected.id || '',
        droneModel: selected.droneModel,
        manufacturer: selected.manufacturer,
        airframe: selected.airframe,
        mtow: selected.mtow,
      }))
    } else {
      setMissionData((prev) => ({
        ...prev,
        aircraftId: '',
        droneModel: '',
        manufacturer: '',
        airframe: '',
        mtow: '',
      }))
    }
  }

  const openAddAircraft = () => {
    setName('')
    setDroneModel('')
    setManufacturer('')
    setAirframe('Rotary')
    setMtow('')
    setSerialNumber('')
    setRegistrationNumber('')
    setIcaoAddress('')
    setIsAddAircraftOpen(true)
  }

  const handleSaveAircraft = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !droneModel || !manufacturer || !airframe || !mtow) {
      toast.error('Please fill in all required fields.')
      return
    }

    setIsSavingAircraft(true)
    try {
      const res = await aircraftService.createAircraft({
        name,
        droneModel,
        manufacturer,
        airframe,
        mtow,
        serialNumber: serialNumber || null,
        registrationNumber: registrationNumber || null,
        icaoAddress: icaoAddress || null,
      })

      if (res.success) {
        toast.success('Aircraft added.')
        setIsAddAircraftOpen(false)
        await fetchAircrafts()
        if (res.data.id) {
          setSelectedAircraftId(res.data.id)
          setMissionData((prev) => ({
            ...prev,
            aircraftId: res.data.id || '',
            droneModel: res.data.droneModel,
            manufacturer: res.data.manufacturer,
            airframe: res.data.airframe,
            mtow: res.data.mtow,
          }))
        }
      } else {
        toast.error(res.message || 'Failed to add aircraft.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add aircraft.')
    } finally {
      setIsSavingAircraft(false)
    }
  }

  const updateMissionData = (field: keyof MissionData, value: string) => {
    setMissionData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary" />
          Flight Mission
        </p>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
          <ShieldCheck className="h-3 w-3" />
          COMPLIANT
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase font-black tracking-widest text-primary">
              Aircraft selection
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[10px] px-2"
              onClick={openAddAircraft}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add aircraft
            </Button>
          </div>

          {isLoadingAircrafts ? (
            <div className="text-xs text-muted-foreground">
              Loading your saved aircraft...
            </div>
          ) : aircraftError ? (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {aircraftError}
            </div>
          ) : savedAircrafts.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              No aircraft saved yet. Add one to continue.
            </div>
          ) : (
            <Select
              value={selectedAircraftId}
              onValueChange={handleAircraftSelect}
            >
              <SelectTrigger className="w-full h-9 text-xs border-primary/20">
                <div className="flex items-center gap-2">
                  <Plane className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Select one of your registered aircraft" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {savedAircrafts.map((aircraft) => (
                  <SelectItem key={aircraft.id} value={aircraft.id || ''}>
                    {aircraft.name} ({aircraft.manufacturer}{' '}
                    {aircraft.droneModel})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedAircraft && (
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
              <div>
                <span className="block font-semibold text-foreground">
                  Model
                </span>
                {selectedAircraft.droneModel}
              </div>
              <div>
                <span className="block font-semibold text-foreground">
                  Manufacturer
                </span>
                {selectedAircraft.manufacturer}
              </div>
              <div>
                <span className="block font-semibold text-foreground">
                  Airframe
                </span>
                {selectedAircraft.airframe}
              </div>
              <div>
                <span className="block font-semibold text-foreground">
                  MTOW
                </span>
                {selectedAircraft.mtow}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center ml-1">
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              Mission Intent
            </Label>
            <span className="text-[9px] font-bold text-muted-foreground mr-1">
              {(missionData.missionIntent || '').length}/200
            </span>
          </div>
          <div className="relative">
            <FileType className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Textarea
              placeholder="Describe your flight purpose, path, and safety precautions..."
              className="pl-9 min-h-[65px] bg-muted/30 border-primary/10 focus-visible:ring-primary/20 resize-none pt-2 text-xs"
              value={missionData.missionIntent}
              onChange={(e) =>
                updateMissionData('missionIntent', e.target.value)
              }
              maxLength={200}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Weight Class
            </Label>
            <Select
              value={missionData.weightClass}
              onValueChange={(val) => updateMissionData('weightClass', val)}
            >
              <SelectTrigger className="w-full h-9 text-xs">
                <div className="flex items-center gap-2">
                  <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Class" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="c0">C0 (&lt;250g)</SelectItem>
                <SelectItem value="c1">C1 (250g-900g)</SelectItem>
                <SelectItem value="c2">C2 (900g-4kg)</SelectItem>
                <SelectItem value="c3">C3 (4kg-25kg)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Operator Phone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Phone number"
                className="pl-9 h-9 bg-muted/30 border-primary/10 focus-visible:ring-primary/20 text-xs"
                value={missionData.operatorPhone}
                onChange={(e) =>
                  updateMissionData('operatorPhone', e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Flyer ID
            </Label>
            <div className="relative">
              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="FLY-XXXXX"
                className="pl-9 h-9 bg-muted/30 border-primary/10 focus-visible:ring-primary/20 text-xs"
                value={missionData.flyerId}
                onChange={(e) => updateMissionData('flyerId', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Operator ID
            </Label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="OP-XXXXX"
                className="pl-9 h-9 bg-muted/30 border-primary/10 focus-visible:ring-primary/20 text-xs"
                value={missionData.operatorId}
                onChange={(e) =>
                  updateMissionData('operatorId', e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Operation Type
            </Label>
            <Select
              value={missionData.operationType}
              onValueChange={(val) => updateMissionData('operationType', val as 'INBOUND' | 'OUTBOUND')}
            >
              <SelectTrigger className="w-full h-9 text-xs border-primary/20 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Select type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INBOUND">Inbound</SelectItem>
                <SelectItem value="OUTBOUND">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Operation Reference (Optional)
            </Label>
            <div className="relative">
              <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="e.g. Flight 101"
                className="pl-9 h-9 bg-muted/30 border-primary/10 focus-visible:ring-primary/20 text-xs"
                value={missionData.operationReference || ''}
                onChange={(e) =>
                  updateMissionData('operationReference', e.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-muted/20 p-2.5 border border-border/50 rounded-lg">
        <Info className="h-3.5 w-3.5 text-primary" />
        Ensuring safety and regulatory compliance for all flights.
      </div>

      <AircraftFormDialog
        isOpen={isAddAircraftOpen}
        isSaving={isSavingAircraft}
        selectedAircraft={null}
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
        onClose={() => setIsAddAircraftOpen(false)}
        onSubmit={handleSaveAircraft}
      />
    </div>
  )
}
