'use client'

import React from 'react'
import { UseFormReturn, Controller } from 'react-hook-form'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field'
import { Loader2, Send } from 'lucide-react'
import { NotificationFormValues } from '../types'

interface NotificationFormProps {
  form: UseFormReturn<NotificationFormValues>
  onSubmit: (data: NotificationFormValues) => void
  isLoading: boolean
}

export function NotificationForm({ form, onSubmit, isLoading }: NotificationFormProps) {
  const typeOptions = [
    { value: 'info', label: 'Informational (Blue)' },
    { value: 'warning', label: 'Warning (Orange/Yellow)' },
    { value: 'success', label: 'Success (Green)' },
    { value: 'error', label: 'Critical/Error (Red)' },
  ]

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup className="gap-5">
        {/* Notification Type Selector */}
        <Controller
          name="type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Notification Type <span className="text-destructive">*</span></FieldLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Notification Title */}
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Title <span className="text-destructive">*</span></FieldLabel>
              <Input
                {...field}
                type="text"
                placeholder="e.g. Scheduled System Maintenance"
                disabled={isLoading}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Notification Message */}
        <Controller
          name="message"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Message <span className="text-destructive">*</span></FieldLabel>
              <Textarea
                {...field}
                placeholder="e.g. The VertiAccess platform will undergo scheduled maintenance tonight between 12:00 AM and 2:00 AM UTC. Some services may be temporarily offline."
                rows={5}
                disabled={isLoading}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Action URL */}
        <Controller
          name="actionUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Action Link (Optional)</FieldLabel>
              <Input
                {...field}
                type="url"
                placeholder="e.g. https://vertiaccess.com/status"
                disabled={isLoading}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Submit button */}
        <Button type="submit" className="w-full mt-4" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Broadcasting Alert...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Broadcast Notification
            </>
          )}
        </Button>
      </FieldGroup>
    </form>
  )
}
