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
import { Label } from '@workspace/ui/components/label'
import {
  MapPin,
  User,
  CreditCard,
  ShieldAlert,
  Lock,
  Ban,
  Loader2,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { incidentService } from '@/services/incident.service'
import { mapIncidentToTicket } from '@/services/incident.types'
import { toast } from 'sonner'
import { cn } from '@workspace/ui/lib/utils'

interface ContextHubProps {
  ticket: Ticket
  onTicketUpdate: (ticket: Ticket) => void
}

function resolveDecisionTargetId(
  ticket: Ticket,
  role: 'operator' | 'landowner',
) {
  if (role === ticket.reporterRole) return ticket.reporterId
  if (role === ticket.targetRole) return ticket.targetId
  return role === 'operator' ? ticket.reporterId : ticket.targetId
}

function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
    case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
    case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
  }
}

export function ContextHub({ ticket, onTicketUpdate }: ContextHubProps) {
  const [currentStatus, setCurrentStatus] = React.useState(ticket.status)
  const [currentPriority, setCurrentPriority] = React.useState(ticket.priority)
  const [activeUpdate, setActiveUpdate] = React.useState<
    'details' | 'decision' | null
  >(null)
  const [decisionAction, setDecisionAction] =
    React.useState<IncidentDecisionAction>('no_action')
  const [decisionTargetRole, setDecisionTargetRole] = React.useState<
    'operator' | 'landowner'
  >(ticket.reporterRole === 'operator' ? 'landowner' : 'operator')
  const [decisionReason, setDecisionReason] = React.useState('')
  const [decisionDurationDays, setDecisionDurationDays] = React.useState('7')

  const reporterProfile = ticket.reporterProfile ?? {
    id: ticket.reporterId,
    name: ticket.operatorName || 'Unknown Operator',
    email: 'Unknown',
    phone: 'Unknown',
    role: (ticket.reporterRole === 'landowner' ? 'landowner' : 'operator') as
      | 'operator'
      | 'landowner',
  }

  const targetProfile = ticket.targetProfile ?? {
    id: ticket.targetId || 'unknown',
    name: ticket.landownerName || 'Unknown Asset Owner',
    email: 'Unknown',
    phone: 'Unknown',
    role: (ticket.targetRole === 'operator' ? 'operator' : 'landowner') as
      | 'operator'
      | 'landowner',
  }

  React.useEffect(() => {
    setCurrentStatus(ticket.status)
    setCurrentPriority(ticket.priority)
    setDecisionAction(
      ticket.decision?.action === 'warning'
        ? 'no_action'
        : (ticket.decision?.action ?? 'no_action'),
    )
    setDecisionTargetRole(
      ticket.decision?.targetRole ??
        (ticket.reporterRole === 'operator' ? 'landowner' : 'operator'),
    )
    setDecisionReason(ticket.decision?.reason ?? '')
    setDecisionDurationDays(
      ticket.decision?.durationDays
        ? String(ticket.decision.durationDays)
        : '7',
    )
  }, [ticket])

  const updateCaseDetails = async () => {
    setActiveUpdate('details')
    try {
      const backendStatus =
        currentStatus === 'under_review'
          ? 'UNDER_REVIEW'
          : currentStatus === 'resolved'
            ? 'RESOLVED'
            : 'OPEN'
      const updated = await incidentService.updateIncidentStatus(ticket.id, {
        status: backendStatus,
        urgency: currentPriority as any,
      })
      onTicketUpdate(mapIncidentToTicket(updated))
      toast.success('Case details updated successfully')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update case details')
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
      decisionAction === 'no_action'
        ? null
        : resolveDecisionTargetId(ticket, decisionTargetRole)

    if (decisionAction !== 'no_action' && !targetId) {
      toast.error('Please choose a valid decision target.')
      return
    }

    setActiveUpdate('decision')
    try {
      const updated = await incidentService.recordDecision(ticket.id, {
        decisionAction: decisionAction as 'no_action' | 'temporary_suspend' | 'ban',
        decisionReason,
        decisionTargetId: targetId,
        decisionTargetRole:
          decisionAction === 'no_action' ? null : decisionTargetRole,
        decisionDurationDays:
          decisionAction === 'temporary_suspend'
            ? Number(decisionDurationDays) || null
            : null,
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
    <Card className="border-border/50 shadow-sm flex flex-col w-full h-full animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
      <CardHeader className="bg-muted/10 border-b border-border/50 p-4 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Incident Details
          </CardTitle>
          <Badge variant="outline" className="font-mono text-[10px] bg-background">
            {ticket.reference}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="p-4 space-y-6">
          
          {/* Initial Report Summary */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              Reporter Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Category</Label>
                  <p className="text-sm font-bold capitalize">{ticket.category.replace(/_/g, ' ')}</p>
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block">Severity</Label>
                  <Badge variant="outline" className={cn("capitalize text-xs px-2 py-0", getPriorityColor(ticket.priority))}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Description</Label>
                <p className="text-sm text-foreground leading-relaxed">
                  {ticket.description}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block mb-1">Impacts</Label>
                {ticket.impactAssessment && ticket.impactAssessment.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {ticket.impactAssessment.map((impact) => (
                      <Badge key={impact} variant="secondary" className="bg-muted/50 text-xs font-medium border-border/40">
                        {impact}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">None</p>
                )}
              </div>

              {ticket.siteName && (
                <div className="flex items-center gap-1.5 pt-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{ticket.siteName}</span>
                </div>
              )}
            </div>
          </section>

          <Separator className="bg-border/40" />

          {/* Involved Parties */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Parties
            </h3>
            <div className="flex flex-col gap-2">
              <PartyRow profile={reporterProfile} label="Reporter" role={ticket.reporterRole ?? 'operator'} />
              <PartyRow profile={targetProfile} label="Target" role={ticket.targetRole ?? 'landowner'} />
            </div>
          </section>

          <Separator className="bg-border/40" />

          {/* Case Management */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" />
              Management
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Status</Label>
                <Select
                  value={currentStatus}
                  onValueChange={(value) => setCurrentStatus(value as typeof currentStatus)}
                  disabled={activeUpdate !== null}
                >
                  <SelectTrigger className="h-8 text-xs bg-muted/10 border-border/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="action_required">Action Required</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Priority</Label>
                <Select
                  value={currentPriority}
                  onValueChange={(value) => setCurrentPriority(value as typeof currentPriority)}
                  disabled={activeUpdate !== null}
                >
                  <SelectTrigger className="h-8 text-xs bg-muted/10 border-border/50">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full h-8 text-xs font-semibold mt-1"
              variant="outline"
              onClick={() => void updateCaseDetails()}
              disabled={activeUpdate === 'details'}
            >
              {activeUpdate === 'details' ? (
                <><Loader2 className="h-3 w-3 animate-spin mr-2" /> Updating...</>
              ) : (
                'Update Case'
              )}
            </Button>
          </section>

          <Separator className="bg-border/40" />

          {/* Final Decision */}
          <section className="space-y-3 pb-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5" />
              Decision
            </h3>
            
            {ticket.decision && (
              <div className="border-l-2 border-primary pl-3 py-1 space-y-1 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase text-primary">
                    {ticket.decision.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    by {ticket.decision.decidedBy || 'Admin'}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground">
                  {ticket.decision.reason}
                </p>
                {ticket.decision.durationDays && (
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Duration: {ticket.decision.durationDays} days
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Action</Label>
                  <Select
                    value={decisionAction}
                    onValueChange={(value) => setDecisionAction(value as IncidentDecisionAction)}
                    disabled={activeUpdate === 'decision'}
                  >
                    <SelectTrigger className="h-8 text-xs bg-muted/10 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_action">No Action</SelectItem>
                      <SelectItem value="temporary_suspend">Temporary Suspend</SelectItem>
                      <SelectItem value="ban">Ban</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Target</Label>
                  <Select
                    value={decisionTargetRole}
                    onValueChange={(value) => setDecisionTargetRole(value as 'operator' | 'landowner')}
                    disabled={activeUpdate === 'decision'}
                  >
                    <SelectTrigger className="h-8 text-xs bg-muted/10 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="landowner">Asset Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {decisionAction === 'temporary_suspend' && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Duration (Days)</Label>
                  <Input
                    type="number"
                    min="1"
                    className="h-8 text-xs bg-muted/10 border-border/50"
                    value={decisionDurationDays}
                    onChange={(e) => setDecisionDurationDays(e.target.value)}
                    disabled={activeUpdate === 'decision'}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Reasoning</Label>
                <Textarea
                  placeholder="Sanction rationale..."
                  className="min-h-[60px] resize-none text-xs bg-muted/10 border-border/50 p-2"
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  disabled={activeUpdate === 'decision'}
                />
              </div>

              <Button
                size="sm"
                className={cn(
                  'w-full h-8 text-xs font-semibold',
                  decisionAction === 'ban' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''
                )}
                onClick={() => void handleDecisionSubmit()}
                disabled={activeUpdate === 'decision'}
              >
                {activeUpdate === 'decision' ? (
                  <><Loader2 className="h-3 w-3 animate-spin mr-2" /> Recording...</>
                ) : (
                  <>
                    {decisionAction === 'ban' ? <Ban className="h-3 w-3 mr-1.5" /> : <Lock className="h-3 w-3 mr-1.5" />}
                    Record Decision
                  </>
                )}
              </Button>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}

function PartyRow({
  profile,
  label,
  role
}: {
  profile: PartyProfile
  label: string
  role: string
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/10 border border-transparent hover:border-border/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm truncate leading-none">{profile.name}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-1 rounded leading-tight">
              {label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
