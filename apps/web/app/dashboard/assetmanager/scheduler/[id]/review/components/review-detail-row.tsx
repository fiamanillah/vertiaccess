import * as React from 'react'

interface DetailRowProps {
  label: string
  value: React.ReactNode
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  )
}
