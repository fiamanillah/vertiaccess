export type TicketStatus = 'action_required' | 'under_review' | 'resolved'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'
export type MessageVisibility = 'reporter' | 'target' | 'internal'
export type AccountStanding = 'good' | 'warned' | 'suspended' | 'banned'
export type IncidentDecisionAction =
  | 'no_action'
  | 'warning'
  | 'temporary_suspend'
  | 'ban'

export interface AttachmentItem {
  id: string
  name: string
  type: string
  size: string
  url: string
  uploadedAt?: string
  uploadedBy?: string
}

export interface Message {
  id: string
  type: 'message'
  sender: 'user' | 'admin'
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  attachments?: AttachmentItem[]
  visibility: MessageVisibility // Crucial for Admin multi-pane view
}

export interface ActionLog {
  id: string
  type: 'action'
  content: string
  timestamp: string
  icon?: string
}

export type ThreadItem = Message | ActionLog

export interface IncidentDecision {
  action: IncidentDecisionAction
  reason: string
  targetId?: string | null
  targetName?: string | null
  targetRole?: 'operator' | 'landowner' | null
  durationDays?: number | null
  decidedBy?: string | null
  decidedAt?: string | null
}

export interface PartyProfile {
  id: string
  name: string
  email: string
  phone: string
  role: 'operator' | 'landowner'
  standing?: AccountStanding
  pastBookings?: number
  disputeCount?: number
  avatarUrl?: string
}

export interface Ticket {
  id: string
  reference: string
  bookingId?: string
  bookingRef: string
  reporterRole?: 'operator' | 'landowner' | 'admin'
  targetRole?: 'operator' | 'landowner' | 'admin'
  reporterProfile?: PartyProfile | null
  targetProfile?: PartyProfile | null
  status: TicketStatus
  priority: TicketPriority
  category: string
  description: string
  disputedAmount?: number
  siteName: string
  siteId: string
  operatorName: string // Reporter or Target
  landownerName: string // Reporter or Target
  reporterId: string
  targetId: string
  assignedAdminId?: string
  createdAt: string
  updatedAt: string
  decision?: IncidentDecision | null
  showInitialSubmission?: boolean
  thread: ThreadItem[]
}
