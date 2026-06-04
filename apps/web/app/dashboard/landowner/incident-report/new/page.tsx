'use client'

import { NewIncidentForm } from '@/components/reporting/new-incident-form'

export default function NewLandownerIncidentPage() {
  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <NewIncidentForm role="landowner" />
    </div>
  )
}
