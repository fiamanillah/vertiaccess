'use client'

import * as React from 'react'
import { Info } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
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
import type { AircraftDto } from '@/services/aircraft.service'

interface AircraftFormDialogProps {
  isOpen: boolean
  isSaving: boolean
  selectedAircraft: AircraftDto | null
  name: string
  manufacturer: string
  droneModel: string
  airframe: AircraftDto['airframe']
  mtow: string
  serialNumber: string
  registrationNumber: string
  icaoAddress: string
  onNameChange: (value: string) => void
  onManufacturerChange: (value: string) => void
  onDroneModelChange: (value: string) => void
  onAirframeChange: (value: AircraftDto['airframe']) => void
  onMtowChange: (value: string) => void
  onSerialNumberChange: (value: string) => void
  onRegistrationNumberChange: (value: string) => void
  onIcaoAddressChange: (value: string) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function AircraftFormDialog({
  isOpen,
  isSaving,
  selectedAircraft,
  name,
  manufacturer,
  droneModel,
  airframe,
  mtow,
  serialNumber,
  registrationNumber,
  icaoAddress,
  onNameChange,
  onManufacturerChange,
  onDroneModelChange,
  onAirframeChange,
  onMtowChange,
  onSerialNumberChange,
  onRegistrationNumberChange,
  onIcaoAddressChange,
  onClose,
  onSubmit,
}: AircraftFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
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

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-bold"
            >
              Aircraft Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g. My DJI Mavic 3 Enterprise"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="manufacturer"
                className="text-xs font-bold"
              >
                Manufacturer *
              </Label>
              <Input
                id="manufacturer"
                placeholder="e.g. DJI, Wingtra"
                value={manufacturer}
                onChange={(e) => onManufacturerChange(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="droneModel"
                className="text-xs font-bold"
              >
                Model *
              </Label>
              <Input
                id="droneModel"
                placeholder="e.g. Mavic 3 Pro"
                value={droneModel}
                onChange={(e) => onDroneModelChange(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                Airframe *
              </Label>
              <Select
                value={airframe}
                onValueChange={(val) =>
                  onAirframeChange(val as AircraftDto['airframe'])
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
              <Label
                htmlFor="mtow"
                className="text-xs font-bold"
              >
                Mass - Minimum Takeoff Weight (MTW) *
              </Label>
              <Input
                id="mtow"
                placeholder="e.g. 1.05 Kg"
                value={mtow}
                onChange={(e) => onMtowChange(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="serialNumber"
                className="text-xs font-bold"
              >
                Serial Number
              </Label>
              <Input
                id="serialNumber"
                placeholder="Serial No. (Optional)"
                value={serialNumber}
                onChange={(e) => onSerialNumberChange(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="registrationNumber"
                className="text-xs font-bold"
              >
                Registration ID
              </Label>
              <Input
                id="registrationNumber"
                placeholder="Reg No. (Optional)"
                value={registrationNumber}
                onChange={(e) => onRegistrationNumberChange(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="icaoAddress"
              className="text-xs font-bold"
            >
              ICAO Address
            </Label>
            <Input
              id="icaoAddress"
              placeholder="ICAO Address (Optional)"
              value={icaoAddress}
              onChange={(e) => onIcaoAddressChange(e.target.value)}
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
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Aircraft'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
