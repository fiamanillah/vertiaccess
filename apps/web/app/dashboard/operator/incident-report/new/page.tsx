'use client'

import { NewIncidentForm } from '@/components/reporting/new-incident-form'

export default function NewOperatorIncidentPage() {
  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <NewIncidentForm role="operator" />
    </div>
  )
}
