import type {
  ActionLog,
  AttachmentItem,
  IncidentDecision,
  PartyProfile,
  Message,
  MessageVisibility,
  Ticket,
  TicketPriority,
  TicketStatus,
  ThreadItem,
} from '@/app/dashboard/components/incident-report/types'

export interface IncidentMessageDto {
  id: string
  role: 'admin' | 'operator' | 'assetmanager'
  sender: string
  text: string
  visibility: MessageVisibility
  timestamp: string
  attachments?: AttachmentItem[]
}

export interface IncidentAttachmentDto extends AttachmentItem {
  messageId?: string | null
}

export interface IncidentDecisionDto extends IncidentDecision {}

export interface IncidentAttachmentPayload {
  fileName: string
  documentType?: string
  fileSize?: string
  fileKey?: string
}

export interface IncidentRecordDto {
  id: string
  vaId?: string | null
  bookingRef: string
  bookingId?: string
  reporterRole?: 'operator' | 'assetmanager' | 'admin'
  targetRole?: 'operator' | 'assetmanager' | 'admin'
  reporterProfile?: PartyProfile | null
  targetProfile?: PartyProfile | null
  assetManagerId?: string | null
  assetManagerName: string
  siteId: string
  siteName: string
  operatorId?: string | null
  operatorName?: string
  type: string
  category?: string
  description: string
  urgency: TicketPriority
  priority: TicketPriority
  status: TicketStatus
  estimatedDamage?: number
  adminNotes?: string
  decision?: IncidentDecisionDto | null
  impactAssessment?: string[] | null
  messages: IncidentMessageDto[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string | null
  incidentDateTime?: string | null
  insuranceNotified?: boolean
  immediateActionTaken?: string | null
  reporterId: string
  targetId?: string | null
  showInitialSubmission?: boolean
  relatedDocumentation?: Array<{
    id: string
    name: string
    type: string
    size: string
    url?: string
    uploadedAt: string
    uploadedBy: string
    messageId?: string | null
  }>
}

export interface IncidentListResponse {
  success: boolean
  message: string
  data: IncidentRecordDto[]
}

export interface IncidentSingleResponse {
  success: boolean
  message: string
  data: IncidentRecordDto
}

export interface CreateIncidentPayload {
  siteId?: string
  bookingId?: string
  clientRequestId?: string
  type: string
  urgency?: TicketPriority
  description: string
  incidentDateTime?: string | null
  insuranceNotified?: boolean
  immediateActionTaken?: string | null
  estimatedDamage?: number | null
  impactAssessment?: string[] | null
  status?: string
  attachments?: IncidentAttachmentPayload[]
}

export interface CreateIncidentMessagePayload {
  messageText: string
  visibility?: MessageVisibility
  attachments?: IncidentAttachmentPayload[]
}

export interface CreateIncidentDecisionPayload {
  decisionAction: 'no_action' | 'temporary_suspend' | 'ban'
  decisionReason: string
  decisionTargetId?: string | null
  decisionTargetRole?: 'operator' | 'assetmanager' | null
  decisionDurationDays?: number | null
}

function mapDecisionToLog(decision: IncidentDecision): ActionLog {
  const suffix =
    decision.action === 'warning'
      ? 'warning'
      : decision.action === 'temporary_suspend'
        ? `temporary suspension${decision.durationDays ? ` for ${decision.durationDays} days` : ''}`
        : decision.action === 'ban'
          ? 'ban'
          : 'closure'

  return {
    id: `decision-${decision.targetId ?? 'none'}-${decision.decidedAt ?? 'now'}`,
    type: 'action',
    content: `Decision recorded: ${suffix}${decision.reason ? ` — ${decision.reason}` : ''}`,
    timestamp: decision.decidedAt || new Date().toISOString(),
  }
}

function mapMessage(message: IncidentMessageDto): Message {
  return {
    id: message.id,
    type: 'message',
    sender: message.role === 'admin' ? 'admin' : 'user',
    senderName: message.sender,
    content: message.text,
    timestamp: message.timestamp,
    visibility: message.visibility,
    attachments: message.attachments,
  }
}

function resolveStatus(status: TicketStatus | string): TicketStatus {
  if (status === 'under_review' || status === 'resolved') return status
  return 'action_required'
}

function resolvePriority(priority: TicketPriority | string): TicketPriority {
  if (priority === 'critical' || priority === 'high' || priority === 'medium')
    return priority
  return 'low'
}

export function mapIncidentToTicket(incident: IncidentRecordDto): Ticket {
  const thread: ThreadItem[] = [
    ...incident.messages.map(mapMessage),
    ...(incident.decision ? [mapDecisionToLog(incident.decision)] : []),
  ]

  return {
    id: incident.id,
    reference: incident.vaId || incident.id,
    bookingId: incident.bookingId,
    bookingRef: incident.bookingRef,
    reporterRole: incident.reporterRole,
    targetRole: incident.targetRole,
    reporterProfile: incident.reporterProfile ?? null,
    targetProfile: incident.targetProfile ?? null,
    status: resolveStatus(incident.status),
    priority: resolvePriority(incident.priority),
    category: incident.category || incident.type,
    description: incident.description,
    disputedAmount: incident.estimatedDamage,
    siteName: incident.siteName,
    siteId: incident.siteId,
    operatorName: incident.operatorName || '',
    assetManagerName: incident.assetManagerName,
    reporterId: incident.reporterId,
    targetId: incident.targetId || '',
    assignedAdminId: undefined,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
    decision: incident.decision || null,
    impactAssessment: incident.impactAssessment || null,
    showInitialSubmission: incident.showInitialSubmission,
    thread,
  }
}

export function mapIncidentListToTickets(
  incidents: IncidentRecordDto[],
): Ticket[] {
  return incidents.map(mapIncidentToTicket)
}
