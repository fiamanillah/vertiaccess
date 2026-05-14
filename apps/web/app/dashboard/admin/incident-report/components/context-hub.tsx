'use client'

import * as React from 'react'
import {
  Ticket,
  PartyProfile,
} from '@/app/dashboard/components/incident-report/types'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Separator } from '@workspace/ui/components/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import {
  ExternalLink,
  MapPin,
  User,
  CreditCard,
  ShieldAlert,
  DollarSign,
} from 'lucide-react'
import { FinancialActionModal } from './modals/financial-action-modal'
import { toast } from 'sonner'

interface ContextHubProps {
  ticket: Ticket
}

const mockReporter: PartyProfile = {
  id: 'op-1',
  name: 'David Chen',
  email: 'david.chen@skyline.com',
  phone: '+44 7700 900123',
  role: 'operator',
  standing: 'good',
  pastBookings: 12,
  disputeCount: 1,
  avatarUrl: '',
}

const mockTarget: PartyProfile = {
  id: 'lo-1',
  name: 'Global Real Estate Group',
  email: 'support@globalrealestate.com',
  phone: '+44 20 7946 0852',
  role: 'landowner',
  standing: 'warned',
  pastBookings: 45,
  disputeCount: 3,
  avatarUrl: '',
}

export function ContextHub({ ticket }: ContextHubProps) {
  const [isFinancialModalOpen, setIsFinancialModalOpen] = React.useState(false)
  const [currentStatus, setCurrentStatus] = React.useState(ticket.status)
  const [currentPriority, setCurrentPriority] = React.useState(ticket.priority)
  const [activeUpdate, setActiveUpdate] = React.useState<
    'status' | 'priority' | null
  >(null)

  const updateCaseField = async (
    field: 'status' | 'priority',
    value: string,
    onSuccess: () => void,
  ) => {
    setActiveUpdate(field)

    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onSuccess()
    toast.success(
      `${field === 'status' ? 'Status' : 'Priority'} updated successfully`,
    )
    setActiveUpdate(null)
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Case Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Case Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Status
            </label>
            <Select
              value={currentStatus}
              onValueChange={(value) => {
                void updateCaseField('status', value, () =>
                  setCurrentStatus(value as typeof currentStatus),
                )
              }}
              disabled={activeUpdate !== null}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="action_required">Action Required</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Priority
            </label>
            <Select
              value={currentPriority}
              onValueChange={(value) => {
                void updateCaseField('priority', value, () =>
                  setCurrentPriority(value as typeof currentPriority),
                )
              }}
              disabled={activeUpdate !== null}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Booking Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Reference
              </p>
              <p className="font-mono text-sm font-semibold">
                {ticket.reference}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-3 w-3" />
              View
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-muted/50">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                Fee
              </p>
              <p className="text-sm font-bold">£125.00</p>
            </div>
            <div className="p-3 rounded-md bg-muted/50">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                Emergency Adjustment
              </p>
              <p className="text-sm font-bold">£150.00</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {ticket.siteName}
              </p>
              <p className="text-xs text-muted-foreground">London, E14</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties Involved */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Involved Parties
        </h3>
        <div className="space-y-3">
          <PartyCard profile={mockReporter} label="Reporter (Operator)" />
          <PartyCard profile={mockTarget} label="Target (Landowner)" />
        </div>
      </div>

      <Separator />

      {/* Power Tools */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-4 w-4" />
          Incident Actions
        </h3>
        <Button
          onClick={() => setIsFinancialModalOpen(true)}
          className="w-full gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Financial Adjustment
        </Button>
        <Button variant="outline" className="w-full gap-2">
          Official Warning
        </Button>
        <Button variant="destructive" className="w-full gap-2">
          Suspend Account
        </Button>
      </div>

      <FinancialActionModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
        ticketId={ticket.id}
        bookingRef={ticket.bookingRef}
      />
    </div>
  )
}

function PartyCard({
  profile,
  label,
}: {
  profile: PartyProfile
  label: string
}) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            {label}
          </span>
          <Badge
            variant={
              profile.standing === 'good'
                ? 'secondary'
                : profile.standing === 'warned'
                  ? 'outline'
                  : 'destructive'
            }
          >
            {profile.standing === 'good'
              ? 'Good'
              : profile.standing === 'warned'
                ? 'Warned'
                : 'Suspended'}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center font-semibold text-xs text-primary">
            {profile.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{profile.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {profile.email}
            </p>
          </div>
        </div>

        <Separator className="my-2" />

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-muted-foreground">Past Bookings</p>
            <p className="text-sm font-bold">{profile.pastBookings}</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground">Disputes</p>
            <p className="text-sm font-bold">{profile.disputeCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
