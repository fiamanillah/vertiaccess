'use client'

import * as React from 'react'
import {
  Ticket,
  PartyProfile,
  IncidentDecisionAction,
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
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import {
  ExternalLink,
  MapPin,
  User,
  CreditCard,
  ShieldAlert,
  ScrollText,
  AlertTriangle,
  Lock,
  Ban,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { incidentService } from '@/services/incident.service'
import { mapIncidentToTicket } from '@/services/incident.types'
import { toast } from 'sonner'
import { cn } from '@workspace/ui/lib/utils'

interface ContextHubProps {
  ticket: Ticket
  onTicketUpdate: (ticket: Ticket) => void
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

function resolveDecisionTargetId(ticket: Ticket, role: 'operator' | 'landowner') {
  if (role === ticket.reporterRole) return ticket.reporterId
  if (role === ticket.targetRole) return ticket.targetId
  return role === 'operator' ? ticket.reporterId : ticket.targetId
}

export function ContextHub({ ticket, onTicketUpdate }: ContextHubProps) {
  const [currentStatus, setCurrentStatus] = React.useState(ticket.status)
  const [currentPriority, setCurrentPriority] = React.useState(ticket.priority)
  const [activeUpdate, setActiveUpdate] = React.useState<
    'status' | 'priority' | 'decision' | null
  >(null)
  const [decisionAction, setDecisionAction] = React.useState<IncidentDecisionAction>('warning')
  const [decisionTargetRole, setDecisionTargetRole] = React.useState<'operator' | 'landowner'>(
    (ticket.reporterRole === 'operator' ? 'landowner' : 'operator'),
  )
  const [decisionReason, setDecisionReason] = React.useState('')
  const [decisionDurationDays, setDecisionDurationDays] = React.useState('7')

  React.useEffect(() => {
    setCurrentStatus(ticket.status)
    setCurrentPriority(ticket.priority)
    setDecisionAction(ticket.decision?.action ?? 'warning')
    setDecisionTargetRole(
      ticket.decision?.targetRole ?? (ticket.reporterRole === 'operator' ? 'landowner' : 'operator'),
    )
    setDecisionReason(ticket.decision?.reason ?? '')
    setDecisionDurationDays(ticket.decision?.durationDays ? String(ticket.decision.durationDays) : '7')
  }, [ticket])

  const updateCaseField = async (
    field: 'status' | 'priority',
    value: string,
    onSuccess: () => void,
  ) => {
    setActiveUpdate(field)
    try {
      if (field === 'status') {
        const backendStatus =
          value === 'under_review'
            ? 'UNDER_REVIEW'
            : value === 'resolved'
              ? 'RESOLVED'
              : 'OPEN'
        const updated = await incidentService.updateIncidentStatus(ticket.id, {
          status: backendStatus,
        })
        onTicketUpdate(mapIncidentToTicket(updated))
      } else {
        onSuccess()
      }
      toast.success(`${field === 'status' ? 'Status' : 'Priority'} updated successfully`)
    } catch (error: any) {
      toast.error(error?.message || `Failed to update ${field}`)
    } finally {
      setActiveUpdate(null)
    }
  }

  const handleDecisionSubmit = async () => {
    if (!decisionReason.trim()) {
      toast.error('Please provide a decision reason.')
      return
    }

    const targetId =
      decisionAction === 'no_action' ? null : resolveDecisionTargetId(ticket, decisionTargetRole)

    if (decisionAction !== 'no_action' && !targetId) {
      toast.error('Please choose a valid decision target.')
      return
    }

    setActiveUpdate('decision')
    try {
      const updated = await incidentService.recordDecision(ticket.id, {
        decisionAction,
        decisionReason,
        decisionTargetId: targetId,
        decisionTargetRole: decisionAction === 'no_action' ? null : decisionTargetRole,
        decisionDurationDays:
          decisionAction === 'temporary_suspend' ? Number(decisionDurationDays) || null : null,
      })
      onTicketUpdate(mapIncidentToTicket(updated))
      toast.success('Incident decision recorded')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to record decision')
    } finally {
      setActiveUpdate(null)
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2.5 text-muted-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
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

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2.5 text-muted-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <MapPin className="h-4 w-4" />
            </div>
            Booking Details
          </CardTitle>
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
                Incident Type
              </p>
              <p className="text-sm font-bold capitalize">{ticket.category.replace(/_/g, ' ')}</p>
            </div>
            <div className="p-3 rounded-md bg-muted/50">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                Reporter
              </p>
              <p className="text-sm font-bold">{ticket.operatorName || ticket.landownerName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {ticket.siteName}
              </p>
              <p className="text-xs text-muted-foreground">Linked booking incident</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Involved Parties
        </h3>
        <div className="space-y-3">
          <PartyCard
            profile={mockReporter}
            label={`Reporter (${ticket.reporterRole ?? 'operator'})`}
          />
          <PartyCard
            profile={mockTarget}
            label={`Target (${ticket.targetRole ?? 'landowner'})`}
          />
        </div>
      </div>

      <Separator />

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2.5 text-muted-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <ShieldAlert className="h-4 w-4" />
            </div>
            Final Decision
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {ticket.decision ? (
            <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="uppercase tracking-widest text-[9px]">{ticket.decision.action.replace(/_/g, ' ')}</Badge>
                <span className="text-xs text-muted-foreground">
                  by {ticket.decision.decidedBy || 'Admin'}
                </span>
              </div>
              <p className="text-sm text-foreground">{ticket.decision.reason}</p>
              {ticket.decision.durationDays ? (
                <p className="text-xs text-muted-foreground">
                  Duration: {ticket.decision.durationDays} days
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No final decision recorded yet.
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Decision action
            </label>
            <Select
              value={decisionAction}
              onValueChange={(value) => setDecisionAction(value as IncidentDecisionAction)}
              disabled={activeUpdate === 'decision'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_action">No Action</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="temporary_suspend">Temporary Suspend</SelectItem>
                <SelectItem value="ban">Ban</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Target user
            </label>
            <Select
              value={decisionTargetRole}
              onValueChange={(value) => setDecisionTargetRole(value as 'operator' | 'landowner')}
              disabled={activeUpdate === 'decision'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="landowner">Landowner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {decisionAction === 'temporary_suspend' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Suspension length (days)
              </label>
              <Input
                type="number"
                min="1"
                value={decisionDurationDays}
                onChange={(e) => setDecisionDurationDays(e.target.value)}
                disabled={activeUpdate === 'decision'}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Decision reason
            </label>
            <Textarea
              placeholder="Summarise the review findings and sanction rationale..."
              className="min-h-[120px] resize-none"
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              disabled={activeUpdate === 'decision'}
            />
          </div>

          <Button
            className={cn(
              'w-full gap-2',
              decisionAction === 'ban' ? 'bg-destructive hover:bg-destructive/90' : '',
            )}
            onClick={() => void handleDecisionSubmit()}
            disabled={activeUpdate === 'decision'}
          >
            {activeUpdate === 'decision' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                {decisionAction === 'ban' ? <Ban className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                Record Decision
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Incident Actions
        </h3>
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Financial adjustments have been removed from incident review.
        </div>
      </div>
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <Badge variant="outline" className="text-[9px] h-5">
                {profile.standing}
              </Badge>
            </div>
            <div className="font-bold">{profile.name}</div>
            <div className="text-xs text-muted-foreground">{profile.email}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-muted-foreground">Phone</div>
            <div className="font-medium">{profile.phone}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Past bookings</div>
            <div className="font-medium">{profile.pastBookings}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
