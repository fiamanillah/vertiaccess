export type TicketStatus = 'action_required' | 'under_review' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type MessageVisibility = 'reporter' | 'target' | 'internal';
export type AccountStanding = 'good' | 'warned' | 'suspended';

export interface Message {
    id: string;
    type: 'message';
    sender: 'user' | 'admin';
    senderName: string;
    senderAvatar?: string;
    content: string;
    timestamp: string;
    attachments?: string[];
    visibility: MessageVisibility; // Crucial for Admin multi-pane view
}

export interface ActionLog {
    id: string;
    type: 'action';
    content: string;
    timestamp: string;
    icon?: string;
}

export type ThreadItem = Message | ActionLog;

export interface PartyProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'operator' | 'landowner';
    standing: AccountStanding;
    pastBookings: number;
    disputeCount: number;
    avatarUrl?: string;
}

export interface Ticket {
    id: string;
    reference: string;
    bookingRef: string;
    status: TicketStatus;
    priority: TicketPriority;
    category: string;
    description: string;
    disputedAmount?: number;
    siteName: string;
    siteId: string;
    operatorName: string; // Reporter or Target
    landownerName: string; // Reporter or Target
    reporterId: string;
    targetId: string;
    assignedAdminId?: string;
    createdAt: string;
    updatedAt: string;
    thread: ThreadItem[];
}
