'use client'

import * as React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import {
  Gavel,
  FileText,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react'

import {
  Field,
  FieldError,
  FieldLabel,
  FieldDescription,
} from '@workspace/ui/components/field'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Separator } from '@workspace/ui/components/separator'
import { FileUploader } from '@/components/file-uploader'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { FormValues } from '../../schema'

interface SiteAuthorityFormProps {
  form: UseFormReturn<FormValues>
  isLoading: boolean
  onNext: () => void
  onPrev: () => void
  isLocked?: boolean
  globalDisabled?: boolean
}


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

export function SiteAuthorityForm({
  form,
  isLoading,
  onNext,
  onPrev,
  isLocked,
  globalDisabled,
}: SiteAuthorityFormProps) {
  const [isUploading, setIsUploading] = React.useState(false)

  const stepFields = ['ownershipDocuments', 'legalDeclaration']
  const hasErrors = stepFields.some(field => form.formState.errors[field as keyof FormValues])
  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="relative pb-4 mb-2 border-b border-border/40">
        
        <div className="relative z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            Proof of Authority
          </h2>
        </div>
      </div>

      <div>
        <div className="space-y-5">
          {/* ─── Ownership Evidence Upload ─────────────────────────── */}
          <FieldSection
            title="Ownership Evidence"
            tooltip="Upload official documents proving your right to use this land (e.g., Title Deed, Lease Agreement)."
          >
            {isLocked && (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex gap-3 text-amber-800 dark:text-amber-200">
                <Info className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <h4 className="font-bold text-sm">Authority Locked</h4>
                  <p className="text-xs mt-1 opacity-80">
                    For safety and compliance, ownership evidence and
                    declarations cannot be edited after approval. Please contact
                    support if you need to update these.
                  </p>
                </div>
              </div>
            )}
            <fieldset disabled={isLocked || globalDisabled}>
              <Controller
                name="ownershipDocuments"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      {isLocked ? 'Uploaded Documents' : 'Upload Documents *'}
                    </FieldLabel>
                    {!isLocked && (
                      <FileUploader
                        accept=".pdf,.jpg,.jpeg,.png"
                        maxSize={15}
                        category="SITE_OWNERSHIP"
                        onUploadComplete={(metadata) => {
                          field.onChange(metadata)
                        }}
                        onUploadingStateChange={setIsUploading}
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
                              {file.fileName || `Proof #${i + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isLocked && (
                      <FieldDescription>
                        Supported formats: PDF, JPG, PNG (Max 10MB per file).
                      </FieldDescription>
                    )}
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </fieldset>
          </FieldSection>

          <Separator />

          {/* ─── Legal Declaration ─────────────────────────────────── */}
          <FieldSection
            title="Legal Declaration"
            tooltip="Confirm your legal standing as owner or authorized agent for this land."
          >
            <fieldset disabled={isLocked || globalDisabled}>
              <Controller
                name="legalDeclaration"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div
                      className={cn(
                        'flex items-start space-x-3 p-4 rounded-xl border transition-all duration-200',
                        field.value
                          ? 'bg-primary/5 border-primary/20 shadow-sm'
                          : 'bg-muted/30 border-border/50',
                        fieldState.invalid &&
                          'border-destructive/50 bg-destructive/5',
                      )}
                    >
                      <Checkbox
                        id="legal-declaration"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                        className="mt-1"
                      />
                      <div className="grid gap-1.5 leading-tight">
                        <label
                          htmlFor="legal-declaration"
                          className="text-sm font-semibold leading-normal cursor-pointer select-none"
                        >
                          I declare that I have the full legal authority to
                          register this site on VertiAccess.
                        </label>
                        <p className="text-xs text-muted-foreground">
                          By checking this box, you affirm that you are the
                          lawful owner or authorized agent of the land described
                          in this application.
                        </p>
                      </div>
                    </div>
                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                        className="mt-1 ml-1"
                      />
                    )}
                  </Field>
                )}
              />
            </fieldset>
          </FieldSection>

          {/* ─── Guidance Note ─────────────────────────────────────── */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800/80 leading-relaxed">
              Our safety team will manually verify these documents. Incomplete
              or forged documentation will lead to immediate rejection of your
              application and potential account suspension.
            </p>
          </div>

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
              Back to Commercial
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
              ) : (
                'Final Review'
              )}
              {!isUploading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
