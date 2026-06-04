'use client'

import * as React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Badge } from '@workspace/ui/components/badge'
import {
  MapPin,
  ArrowRight,
  ArrowLeft,
  Circle,
  Ruler,
  Pentagon,
  Map,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'
import { InteractiveMap } from '@/components/map/interactive-map'
import { PreviewMap } from '@/components/map/preview-map'
import type {
  GeometryMode,
  ActiveBoundary,
  MapCenter,
} from '@/components/map/map-types'
import {
  DEFAULT_CENTER,
  DEFAULT_TOAL_RADIUS,
  DEFAULT_EMERGENCY_RADIUS,
} from '@/components/map/map-types'
import { FormValues } from '../../schema'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SiteLocationFormProps {
  form: UseFormReturn<FormValues>
  isLoading: boolean
  onNext: () => void
  onPrev: () => void
  isLocked?: boolean
  globalDisabled?: boolean
}

// ─── Calculated area helpers ──────────────────────────────────────────────────

function circleAreaM2(r: number) {
  return Math.PI * r * r
}

function polygonAreaM2(pts: [number, number][]): number {
  if (pts.length < 3) return 0
  const D = 111_320
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const [y1, x1] = pts[i]!
    const [y2, x2] = pts[(i + 1) % pts.length]!
    area += (x2 - x1) * Math.cos(((y1 + y2) / 2) * (Math.PI / 180)) * (y2 - y1)
  }
  return (Math.abs(area) * D * D) / 2
}

function fmt(m2: number): string {
  if (m2 === 0) return '—'
  return `${Math.round(m2).toLocaleString()} m²`
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-center">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function FieldSection({
  title,
  tooltip,
  children,
}: {
  title: string
  tooltip?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      {children}
    </div>
  )
}

type GeomSelectorProps = {
  value: GeometryMode
  color?: string
  onChange: (m: GeometryMode) => void
}

function GeometrySelector({
  value,
  color = '#5b6cf9',
  onChange,
}: GeomSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange('circle')}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200',
          value === 'circle'
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/30 hover:bg-muted/20',
        )}
      >
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
            value === 'circle' ? 'bg-primary/10' : 'bg-muted',
          )}
        >
          <Circle
            className="h-3.5 w-3.5"
            style={value === 'circle' ? { color } : {}}
          />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Circular</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Radius boundary
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChange('polygon')}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200',
          value === 'polygon'
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/30 hover:bg-muted/20',
        )}
      >
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
            value === 'polygon' ? 'bg-primary/10' : 'bg-muted',
          )}
        >
          <Pentagon
            className="h-3.5 w-3.5"
            style={value === 'polygon' ? { color } : {}}
          />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Polygon</p>
          <p className="text-xs text-muted-foreground mt-0.5">Custom shape</p>
        </div>
      </button>
    </div>
  )
}

type RadiusControlProps = {
  label: string
  value: number
  min?: number
  max?: number
  accentColor?: string
  areaValue?: string
  warning?: string
  onChange: (r: number) => void
}

function RadiusControl({
  label,
  value,
  min = 1,
  max = 2000,
  accentColor = '#5b6cf9',
  areaValue,
  warning,
  onChange,
}: RadiusControlProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FieldLabel className="flex items-center gap-1.5">
          <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </FieldLabel>
        <Badge variant="outline" className="font-mono text-xs tabular-nums">
          {value} m
        </Badge>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor }}
        aria-label={`${label} in metres`}
      />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
        <span>{min} m</span>
        <span>500 m</span>
        <span>1 km</span>
        <span>{max / 1000} km</span>
      </div>
      <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/50">
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={min}
            step={1}
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!isNaN(v) && v >= min) onChange(Math.min(max, v))
            }}
            className="w-24 h-9 font-mono text-sm"
          />
          <span className="text-xs text-muted-foreground">metres</span>
        </div>
        {areaValue && (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
              Calculated Area
            </span>
            <span className="text-xs font-bold font-mono text-foreground">
              {areaValue}
            </span>
          </div>
        )}
      </div>
      {warning && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{warning}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SiteLocationForm({
  form,
  isLoading,
  onNext,
  onPrev,
  isLocked,
  globalDisabled,
}: SiteLocationFormProps) {
  const siteType: string = form.watch('siteType') ?? 'toal'
  const isEmergencyPrimary = siteType === 'emergency'
  const values = form.getValues()

  const [mapCenter, setMapCenter] = React.useState<MapCenter>({
    lat: values.latitude ?? DEFAULT_CENTER.lat,
    lng: values.longitude ?? DEFAULT_CENTER.lng,
  })

  // TOAL boundary
  const [toalMode, setToalMode] = React.useState<GeometryMode>(
    values.toalGeometryMode ?? 'circle',
  )
  const [toalRadius, setToalRadius] = React.useState(
    values.toalRadius ?? DEFAULT_TOAL_RADIUS,
  )
  const [toalPts, setToalPts] = React.useState<[number, number][]>(
    values.toalPolygonPoints ?? [],
  )

  // Emergency boundary
  const [showEmergency, setShowEmergency] = React.useState(
    values.allowEmergencyLanding ?? isEmergencyPrimary,
  )
  const [emergencyMode, setEmergencyMode] = React.useState<GeometryMode>(
    values.emergencyGeometryMode ?? 'circle',
  )
  const [emergencyRadius, setEmergencyRadius] = React.useState(
    values.emergencyRadius ?? DEFAULT_EMERGENCY_RADIUS,
  )
  const [emergencyPts, setEmergencyPts] = React.useState<[number, number][]>(
    values.emergencyPolygonPoints ?? [],
  )

  // Active boundary being edited on map
  const [activeBoundary, setActiveBoundary] = React.useState<ActiveBoundary>(
    isEmergencyPrimary ? 'emergency' : 'toal',
  )

  // Computed areas
  const toalArea =
    toalMode === 'circle'
      ? fmt(circleAreaM2(toalRadius))
      : fmt(polygonAreaM2(toalPts))
  const emergencyArea =
    emergencyMode === 'circle'
      ? fmt(circleAreaM2(emergencyRadius))
      : fmt(polygonAreaM2(emergencyPts))

  // Sync to form
  React.useEffect(() => {
    form.setValue('latitude', mapCenter.lat)
    form.setValue('longitude', mapCenter.lng)
    // TOAL
    form.setValue('toalGeometryMode', toalMode)
    form.setValue('toalRadius', toalMode === 'circle' ? toalRadius : undefined)
    form.setValue('toalPolygonPoints', toalMode === 'polygon' ? toalPts : [])
    form.setValue(
      'toalAreaM2',
      toalMode === 'circle' ? circleAreaM2(toalRadius) : polygonAreaM2(toalPts),
    )
    // Emergency
    form.setValue('allowEmergencyLanding', showEmergency)
    if (showEmergency) {
      form.setValue('emergencyGeometryMode', emergencyMode)
      form.setValue(
        'emergencyRadius',
        emergencyMode === 'circle' ? emergencyRadius : undefined,
      )
      form.setValue(
        'emergencyPolygonPoints',
        emergencyMode === 'polygon' ? emergencyPts : [],
      )
      form.setValue(
        'emergencyAreaM2',
        emergencyMode === 'circle'
          ? circleAreaM2(emergencyRadius)
          : polygonAreaM2(emergencyPts),
      )
    }
  }, [
    mapCenter,
    toalMode,
    toalRadius,
    toalPts,
    showEmergency,
    emergencyMode,
    emergencyRadius,
    emergencyPts,
    form,
  ])

  // Adjust state if isEmergencyPrimary changes (e.g. from a previous step)
  const [prevIsEmergencyPrimary, setPrevIsEmergencyPrimary] =
    React.useState(isEmergencyPrimary)
  if (isEmergencyPrimary !== prevIsEmergencyPrimary) {
    setPrevIsEmergencyPrimary(isEmergencyPrimary)
    if (isEmergencyPrimary) {
      setShowEmergency(true)
      setActiveBoundary('emergency')
    }
  }

  const handleGeometryModeChange = (
    boundary: 'toal' | 'emergency',
    mode: GeometryMode,
  ) => {
    if (boundary === 'toal') {
      setToalMode(mode)
      setToalPts([])
    } else {
      setEmergencyMode(mode)
      setEmergencyPts([])
    }
  }

  return (
    <Card className="shadow-md border-border/60">
      <CardHeader className="relative overflow-hidden pb-3 pt-5 px-5 border-b">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
        <div className="relative z-10">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Location &amp; Boundaries
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-5">
        {isLocked && !globalDisabled && (
          <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex gap-3 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <h4 className="font-bold text-sm">Location Locked</h4>
              <p className="text-xs mt-1 opacity-80">
                For safety and compliance, location boundaries and coordinates
                cannot be edited after approval. Please contact support if you
                need to update these.
              </p>
            </div>
          </div>
        )}
        <fieldset disabled={isLocked || globalDisabled} className="space-y-5">
          {/* ─── Address ─────────────────────────────────────── */}
          <FieldSection
            title="Address"
            tooltip="Exact physical location of your site."
          >
            <FieldGroup className="gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="address"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Full Address *</FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </InputGroupAddon>
                        <InputGroupInput
                          {...field}
                          placeholder="Physical address or precise description"
                          disabled={isLoading}
                        />
                      </InputGroup>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="postcode"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Postcode *</FieldLabel>
                      <Input
                        {...field}
                        placeholder="SW1A 1AA"
                        disabled={isLoading}
                        className="uppercase"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </FieldSection>

          <Separator />

          {/* ─── TOAL Boundary ──────────────────────────────── */}
          {!isEmergencyPrimary && (
            <>
              <FieldSection
                title="TOAL Boundary"
                tooltip="Define the Take-off & Landing operational area using a circle or custom polygon."
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <FieldLabel>Geometry Type</FieldLabel>
                    <GeometrySelector
                      value={toalMode}
                      color="#5b6cf9"
                      onChange={(m) => handleGeometryModeChange('toal', m)}
                    />
                  </div>

                  {toalMode === 'circle' && (
                    <RadiusControl
                      label="TOAL Radius"
                      value={toalRadius}
                      accentColor="#5b6cf9"
                      areaValue={toalArea}
                      onChange={setToalRadius}
                    />
                  )}

                  {toalMode === 'polygon' && (
                    <>
                      <div className="rounded-xl bg-[#5b6cf9]/5 border border-[#5b6cf9]/20 px-4 py-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-foreground">
                            TOAL drawing mode.
                          </span>{' '}
                          Click on the map to place vertices. Use the{' '}
                          <span
                            className="font-semibold"
                            style={{ color: '#5b6cf9' }}
                          >
                            TOAL
                          </span>{' '}
                          tab on the map to ensure you&apos;re drawing the right
                          boundary.
                        </p>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-[#5b6cf9]/20">
                        <span className="text-xs text-muted-foreground">
                          TOAL Calculated Area
                        </span>
                        <span className="text-sm font-bold font-mono text-foreground">
                          {toalArea}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </FieldSection>

              <Separator />

              {/* ─── Emergency Toggle ────────────────────── */}
              <FieldSection
                title="Emergency Landings"
                tooltip="Enable to allow emergency & recovery landings at this site and define a recovery boundary."
              >
                <button
                  type="button"
                  onClick={() => {
                    const next = !showEmergency
                    setShowEmergency(next)
                    if (next) setActiveBoundary('emergency')
                    else setActiveBoundary('toal')
                  }}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 text-left',
                    showEmergency
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                      : 'border-border hover:border-amber-300 hover:bg-muted/20',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                        showEmergency
                          ? 'bg-amber-100 dark:bg-amber-900/40'
                          : 'bg-muted',
                      )}
                    >
                      <AlertTriangle
                        className={cn(
                          'h-4 w-4',
                          showEmergency
                            ? 'text-amber-500'
                            : 'text-muted-foreground',
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        Allow Emergency Landings
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {showEmergency
                          ? 'Emergency landing boundary is active'
                          : 'Tap to enable and define the recovery area'}
                      </p>
                    </div>
                  </div>
                  {showEmergency ? (
                    <ToggleRight className="h-6 w-6 text-amber-500 shrink-0" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-muted-foreground shrink-0" />
                  )}
                </button>
              </FieldSection>

              <Separator />
            </>
          )}

          {/* ─── Emergency Boundary Config ──────────────────── */}
          {showEmergency && (
            <>
              <FieldSection
                title="Emergency & Recovery Boundary"
                tooltip={
                  isEmergencyPrimary
                    ? 'Define the emergency & recovery operational area.'
                    : 'Must be larger than the TOAL boundary — typically 3–5× the TOAL radius.'
                }
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <FieldLabel>Geometry Type</FieldLabel>
                    <GeometrySelector
                      value={emergencyMode}
                      color="#f59e0b"
                      onChange={(m) => handleGeometryModeChange('emergency', m)}
                    />
                  </div>

                  {emergencyMode === 'circle' && (
                    <RadiusControl
                      label="Emergency Radius"
                      value={emergencyRadius}
                      min={1}
                      max={5000}
                      accentColor="#f59e0b"
                      areaValue={emergencyArea}
                      warning={
                        !isEmergencyPrimary && emergencyRadius <= toalRadius
                          ? `Emergency radius must be larger than the TOAL radius (${toalRadius} m). Currently ${emergencyRadius <= toalRadius ? `${toalRadius - emergencyRadius + 1} m short` : 'OK'}.`
                          : undefined
                      }
                      onChange={setEmergencyRadius}
                    />
                  )}

                  {emergencyMode === 'polygon' && (
                    <>
                      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300/40 px-4 py-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-foreground">
                            Emergency drawing mode.
                          </span>{' '}
                          Switch to the{' '}
                          <span className="font-semibold text-amber-500">
                            Emergency
                          </span>{' '}
                          tab on the map, then click points to draw the recovery
                          boundary.
                        </p>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-amber-400/20">
                        <span className="text-xs text-muted-foreground">
                          Emergency Calculated Area
                        </span>
                        <span className="text-sm font-bold font-mono text-foreground">
                          {emergencyArea}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </FieldSection>

              <Separator />
            </>
          )}

          {/* ─── Map ─────────────────────────────────────────── */}
          <FieldSection
            title="Map Interface"
            tooltip={
              isLocked
                ? 'Current site boundaries.'
                : 'Use the search bar to find your site, then place and adjust the boundary on the map.'
            }
          >
            {isLocked ? (
              <div className="h-[560px] rounded-xl overflow-hidden border border-border/40 relative z-0">
                <PreviewMap
                  center={mapCenter}
                  toalRadius={toalRadius}
                  emergencyRadius={emergencyRadius}
                  showEmergency={showEmergency}
                  toalMode={toalMode}
                  emergencyMode={emergencyMode}
                  initialToalPolygonPoints={toalPts}
                  initialEmergencyPolygonPoints={emergencyPts}
                />
              </div>
            ) : (
              <>
                <InteractiveMap
                  center={mapCenter}
                  toalRadius={toalRadius}
                  emergencyRadius={emergencyRadius}
                  showEmergency={showEmergency}
                  activeBoundary={activeBoundary}
                  toalMode={toalMode}
                  emergencyMode={emergencyMode}
                  initialToalPolygonPoints={toalPts}
                  initialEmergencyPolygonPoints={emergencyPts}
                  onActiveBoundaryChange={setActiveBoundary}
                  onCenterChange={setMapCenter}
                  onToalPolygonChange={setToalPts}
                  onEmergencyPolygonChange={setEmergencyPts}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {isEmergencyPrimary || !showEmergency
                    ? 'Click the map or drag the marker to reposition the boundary centre.'
                    : 'Use the TOAL / Emergency tabs on the map to switch which boundary you are editing.'}
                </p>
              </>
            )}
          </FieldSection>
        </fieldset>

        {/* ─── Footer ──────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            type="button"
            onClick={onPrev}
            disabled={isLoading}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={isLoading}
            className="gap-2 font-semibold shadow-md shadow-primary/20 min-w-[140px]"
          >
            {isLoading ? 'Saving...' : 'Continue'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
