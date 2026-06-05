'use client'

import * as React from 'react'
import { Controller, UseFormReturn, Path, FieldValues } from 'react-hook-form'
import { format, parseISO, addDays, isWeekend } from 'date-fns'
import {
  FileText,
  Calendar as CalendarIcon,
  CheckSquare,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Clock,
  Info,
  AlertTriangle,
} from 'lucide-react'

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field'
import { Button } from '@workspace/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover'
import { Calendar } from '@workspace/ui/components/calendar'
import { Separator } from '@workspace/ui/components/separator'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { cn } from '@workspace/ui/lib/utils'
import { FileUploader } from '@/components/file-uploader'

import { FormValues, ACTIVATION_MIN_DAYS } from '../../schema'

interface SitePolicyFormProps {
  form: UseFormReturn<FormValues>
  isLoading: boolean
  onNext: () => void
  onPrev: () => void
  isPolicyDocsLocked?: boolean
  globalDisabled?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the earliest selectable date = today + N calendar days */
function getMinActivationDate(minDays: number): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + minDays)
  return date
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

/** Date + Time picker pair */
function DateTimePicker<T extends FieldValues>({
  dateName,
  timeName,
  label,
  form,
  disabled,
  disabledDates,
  hint,
}: {
  dateName: Path<T>
  timeName: Path<T>
  label: string
  form: UseFormReturn<T>
  disabled?: boolean
  disabledDates?: (date: Date) => boolean
  hint?: string
}) {
  const timeOptions = React.useMemo(() => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (const min of ['00', '30']) {
        options.push(`${hour.toString().padStart(2, '0')}:${min}`)
      }
    }
    return options
  }, [])

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Date Selection */}
        <Controller
          name={dateName}
          control={form.control}
          render={({ field, fieldState }) => (
            <div className="flex-1 space-y-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                      'w-full justify-start text-left font-normal border-input/50 bg-muted/20',
                      !field.value && 'text-muted-foreground',
                      fieldState.invalid && 'border-destructive/60',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {field.value ? (
                      format(parseISO(field.value), 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={field.value ? parseISO(field.value) : undefined}
                    disabled={disabledDates}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(format(date, 'yyyy-MM-dd'))
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              {fieldState.invalid && fieldState.error?.message && (
                <p className="text-xs text-destructive flex items-start gap-1.5 pt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        {/* Time Selection */}
        <Controller
          name={timeName}
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-11 border-input/50 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <SelectValue placeholder="Time" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
          <Info className="h-3 w-3 shrink-0" />
          {hint}
        </p>
      )}
    </Field>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function SitePolicyForm({
  form,
  isLoading,
  onNext,
  onPrev,
  isPolicyDocsLocked,
  globalDisabled,
}: SitePolicyFormProps) {
  const isPermanent = form.watch('isPermanentActivation')

  // Earliest allowed start date = 5 calendar days from today
  const minActivationDate = React.useMemo(
    () => getMinActivationDate(ACTIVATION_MIN_DAYS),
    [],
  )

  // Disable any day before the minimum date on the calendar (weekends allowed)
  const isDateDisabled = React.useCallback(
    (date: Date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      const min = new Date(minActivationDate)
      min.setHours(0, 0, 0, 0)
      return d < min
    },
    [minActivationDate],
  )

  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="relative pb-4 mb-2 border-b border-border/40">
        
        <div className="relative z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Operational Policy
          </h2>
        </div>
      </div>

      <div>
        <div className="space-y-5">
          {/* ─── Availability Window ───────────────────────────────── */}
          <FieldSection
            title="Availability Window"
            tooltip={`Set when your site becomes active. The start date must be at least ${ACTIVATION_MIN_DAYS} days from today to allow time for review.`}
          >
            <fieldset disabled={globalDisabled}>
              <FieldGroup className="gap-4">
                {/* Activation Start — always first */}
                <DateTimePicker
                  label="Activation Start *"
                  dateName="activationStartDate"
                  timeName="activationStartTime"
                  form={form}
                  disabled={isLoading}
                  disabledDates={isDateDisabled}
                  hint={`Must be at least ${ACTIVATION_MIN_DAYS} days from today.`}
                />

                {/* Activation End — only when not permanent */}
                {!isPermanent && (
                  <DateTimePicker
                    label="Activation End"
                    dateName="activationEndDate"
                    timeName="activationEndTime"
                    form={form}
                    disabled={isLoading}
                  />
                )}

                {/* Permanent Activation toggle — at the bottom */}
                <Controller
                  name="isPermanentActivation"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-xl border border-border/50">
                      <Checkbox
                        id="permanent"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="permanent"
                          className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Permanent Activation
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Site remains active until further notice. No end date
                          required.
                        </p>
                      </div>
                    </div>
                  )}
                />
              </FieldGroup>
            </fieldset>
          </FieldSection>

          <Separator />

          {/* ─── Booking Approval Model ────────────────────────────── */}
          <FieldSection
            title="Approval Model"
            tooltip="Auto approval instantly confirms bookings on payment. Manual approval lets you review each request first."
          >
            <fieldset disabled={globalDisabled}>
              <Controller
                name="bookingApprovalModel"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Approval Workflow *</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-12! border-input/50 bg-muted/20">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                          <SelectValue placeholder="Select approval model..." />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">
                          <div className="flex flex-col w-full items-start">
                            <span className="font-medium">
                              Auto Approval (Instant)
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Bookings are confirmed immediately upon payment.
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="manual">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">
                              Manual Approval (Review)
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              You must review and approve each booking request.
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </fieldset>
          </FieldSection>

          <Separator />

          {/* ─── Documents Upload ──────────────────────────────────── */}
          <FieldSection
            title="Policy & Operational Documents"
            tooltip="Upload site rules, insurance certificates, photos, or other relevant documents."
          >
            {isPolicyDocsLocked && (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex gap-3 text-amber-800 dark:text-amber-200">
                <Info className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <h4 className="font-bold text-sm">Documents Locked</h4>
                  <p className="text-xs mt-1 opacity-80">
                    For safety and compliance, operational documents cannot be
                    edited after approval. Please contact support if you need to
                    update these.
                  </p>
                </div>
              </div>
            )}
            <fieldset disabled={isPolicyDocsLocked || globalDisabled}>
              <Controller
                name="policyDocuments"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      {isPolicyDocsLocked
                        ? 'Uploaded Documents'
                        : 'Upload Documents'}
                    </FieldLabel>
                    {!isPolicyDocsLocked && (
                      <FileUploader
                        accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx"
                        maxSize={15}
                        category="SITE_POLICY"
                        onUploadComplete={(metadata) => {
                          field.onChange(metadata)
                        }}
                      />
                    )}
                    {Array.isArray(field.value) && field.value.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2">
                        {field.value.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 w-fit"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            <span className="font-medium">
                              {file.fileName || `Document #${i + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                )}
              />
            </fieldset>
          </FieldSection>

          {/* ─── Footer Actions ────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              type="button"
              onClick={onPrev}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Location
            </Button>
            <Button
              type="button"
              onClick={onNext}
              disabled={isLoading}
              className="gap-2 font-semibold shadow-md shadow-primary/20 min-w-[140px]"
            >
              {isLoading ? 'Saving...' : 'Review Site Details'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
