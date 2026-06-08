'use client'

import * as React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
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
import { Textarea } from '@workspace/ui/components/textarea'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import {
  Mail,
  Phone,
  Building2,
  Tag,
  Zap,
  ArrowRight,
  ImageIcon,
  Info,
} from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { Separator } from '@workspace/ui/components/separator'
import { FileUploader } from '@/components/file-uploader'

import { FormValues } from '../../schema'

interface SiteInformationFormProps {
  form: UseFormReturn<FormValues>
  isLoading: boolean
  onNext: () => void
  onCancel: () => void
  isIdentityLocked?: boolean
  globalDisabled?: boolean
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-center">
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

export function SiteInformationForm({
  form,
  isLoading,
  onNext,
  onCancel,
  isIdentityLocked,
  globalDisabled,
}: SiteInformationFormProps) {
  const [isUploading, setIsUploading] = React.useState(false)

  const stepFields = ['name', 'category', 'siteType', 'contactEmail', 'contactPhone']
  const hasErrors = stepFields.some(field => form.formState.errors[field as keyof FormValues])
  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="relative pb-4 mb-2 border-b border-border/40">
        
        <div className="relative z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Site Details
          </h2>
        </div>
      </div>

      <div>
        <div className="space-y-5">
          {/* ─── Identity ─────────────────────────────────── */}
          <FieldSection title="Identity">
            {isIdentityLocked && (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex gap-3 text-amber-800 dark:text-amber-200">
                <Info className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <h4 className="font-bold text-sm">Identity Locked</h4>
                  <p className="text-xs mt-1 opacity-80">
                    For safety and compliance, core site identity details cannot
                    be edited after approval. Please contact support if you need
                    to update these.
                  </p>
                </div>
              </div>
            )}
            <fieldset disabled={isIdentityLocked || globalDisabled}>
              <FieldGroup className="gap-4">
                {/* Site Name */}
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Site Name *</FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </InputGroupAddon>
                        <InputGroupInput
                          {...field}
                          placeholder="e.g., North Field Landing Zone"
                          disabled={isLoading}
                          autoComplete="off"
                        />
                      </InputGroup>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Category + Primary Function */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="category"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Category *</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={
                            isLoading || isIdentityLocked || globalDisabled
                          }
                        >
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <SelectValue placeholder="Select category..." />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="drone_port">Drone Port</SelectItem>
                            <SelectItem value="vertiport">Vertiport</SelectItem>
                            <SelectItem value="business_park">Business Park</SelectItem>
                            <SelectItem value="port_facility">Port Facility</SelectItem>
                            <SelectItem value="nhs_facility">NHS Facility</SelectItem>
                            <SelectItem value="council_land">Council Land</SelectItem>
                            <SelectItem value="private_estate">Private Estate</SelectItem>
                            <SelectItem value="logistics_hub">Logistics Hub</SelectItem>
                            <SelectItem value="utility_asset">Utility Asset</SelectItem>
                            <SelectItem value="transport_infrastructure">
                              Transport Infrastructure
                            </SelectItem>
                            <SelectItem value="renewable_energy">
                              Renewable and Energy
                            </SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="siteType"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Primary Function *</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={
                            isLoading || isIdentityLocked || globalDisabled
                          }
                        >
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <SelectValue placeholder="Select function..." />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="toal">
                              Take-off &amp; Landing (TOAL)
                            </SelectItem>
                            <SelectItem value="emergency">
                              Emergency &amp; Recovery Site
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </fieldset>
          </FieldSection>

          <Separator />

          {/* ─── Description ──────────────────────────────── */}
          <FieldSection
            title="Property Description"
            tooltip="Describe the site's characteristics, access routes, and key features for operators."
          >
            <fieldset disabled={globalDisabled}>
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      {...field}
                      placeholder="e.g., 4-acre private estate with a maintained grass clearing suitable for TOAL operations. Access via the main estate gate on Ashford Lane. No overhead obstructions within 500m."
                      disabled={isLoading}
                      className="min-h-[120px] resize-none"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </fieldset>
          </FieldSection>

          <Separator />

          {/* ─── Site Photos ───────────────────────────────── */}
          <FieldSection
            title="Site Photos"
            tooltip="Upload photos of the landing area, surroundings, and access points."
          >
            <fieldset disabled={globalDisabled}>
              <Controller
                name="photoUrls"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      Upload Photos
                    </FieldLabel>
                    <FileUploader
                      accept="image/jpeg,image/png,image/webp"
                      maxSize={15}
                      category="SITE_PHOTO"
                      onUploadComplete={(metadata) => {
                        field.onChange(metadata)
                      }}
                      onUploadingStateChange={setIsUploading}
                    />
                    {/* Show count of ready photos */}
                    {Array.isArray(field.value) && field.value.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {field.value.length} photo
                        {field.value.length !== 1 ? 's' : ''} ready for
                        submission
                      </p>
                    )}
                  </Field>
                )}
              />
            </fieldset>
          </FieldSection>

          <Separator />

          {/* ─── Site Contact ──────────────────────────────── */}
          <FieldSection
            title="Site Contact"
            tooltip="The person operators should contact for access or questions about this site."
          >
            <fieldset disabled={globalDisabled}>
              <FieldGroup className="gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="contactEmail"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Contact Email *</FieldLabel>
                        <InputGroup>
                          <InputGroupAddon>
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </InputGroupAddon>
                          <InputGroupInput
                            {...field}
                            type="email"
                            placeholder="admin@estate.co.uk"
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
                    name="contactPhone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Contact Phone *</FieldLabel>
                        <InputGroup>
                          <InputGroupAddon>
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          </InputGroupAddon>
                          <InputGroupInput
                            {...field}
                            placeholder="+44 20 7946 0958"
                            disabled={isLoading}
                          />
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </fieldset>
          </FieldSection>

          {/* ─── Footer Actions ────────────────────────────── */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onNext}
              disabled={isLoading || hasErrors || isUploading}
              className="gap-2 font-semibold shadow-md shadow-primary/20 min-w-[140px]"
            >
              {isUploading ? (
                <span className="flex items-center gap-1.5">
                  Uploading...
                </span>
              ) : isLoading ? (
                'Saving...'
              ) : (
                'Continue'
              )}
              {!isLoading && !isUploading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
