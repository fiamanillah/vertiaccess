'use client'

import * as React from 'react'
import { Download, ExternalLink, FileText, LucideIcon } from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { cn } from '@workspace/ui/lib/utils'
import { toast } from 'sonner'

export function DetailBox({
  label,
  value,
  isBadge,
  badgeVariant,
  icon: Icon,
  subtitle,
  isHighlight,
}: {
  label: string
  value: string
  isBadge?: boolean
  badgeVariant?: 'indigo' | 'amber' | 'emerald' | 'destructive' | 'orange'
  icon?: LucideIcon
  subtitle?: string
  isHighlight?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
      </div>
      {isBadge ? (
        <Badge
          className={cn(
            'border-none text-xs font-semibold px-2.5 h-6 rounded-full capitalize',
            badgeVariant === 'indigo' && 'bg-indigo-100 text-indigo-700',
            badgeVariant === 'amber' && 'bg-amber-100 text-amber-700',
            badgeVariant === 'emerald' && 'bg-emerald-100 text-emerald-700',
            badgeVariant === 'destructive' && 'bg-rose-100 text-rose-700',
            badgeVariant === 'orange' && 'bg-orange-100 text-orange-700',
          )}
          variant="outline"
        >
          {value}
        </Badge>
      ) : (
        <div className="space-y-0.5">
          <p
            className={cn(
              'text-sm font-semibold tracking-tight',
              isHighlight ? 'text-primary text-base font-bold' : 'text-foreground',
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground font-medium">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function DocumentListItem({
  name,
  size,
  type,
  url,
}: {
  name: string
  size?: string
  type: string
  url?: string
}) {
  const handleView = () => {
    if (url) window.open(url, '_blank')
    else toast.info('File preview not available')
  }

  return (
    <div className="p-3 rounded-xl border border-border bg-background hover:bg-muted/30 transition-all group flex items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
          <FileText className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-semibold truncate text-foreground">{name}</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
            {type} {size ? `• ${size}` : ''}
          </p>
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {url && (
          <a href={url} download={name} target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </a>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
          onClick={handleView}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function RejectionCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: () => void
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center space-x-2 p-3 rounded-lg border transition-all',
        checked
          ? 'bg-accent border-accent text-accent-foreground shadow-sm'
          : 'bg-muted/5 border-border/50 hover:bg-muted/10',
        disabled
          ? 'opacity-50 cursor-not-allowed pointer-events-none'
          : 'cursor-pointer',
      )}
      onClick={!disabled ? onCheckedChange : undefined}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <label
        htmlFor={id}
        className={cn(
          'text-xs font-semibold leading-tight flex-1',
          !disabled ? 'cursor-pointer' : 'cursor-not-allowed',
        )}
      >
        {label}
      </label>
    </div>
  )
}
