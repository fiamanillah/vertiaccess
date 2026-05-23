import { db } from '@vertiaccess/database'

// --------------- role helpers ---------------
export function mapRoleToDbRole(
  role: string,
): 'ADMIN' | 'OPERATOR' | 'LANDOWNER' {
  const normalized = (role || '').toUpperCase()
  if (normalized === 'ADMIN') return 'ADMIN'
  if (normalized === 'LANDOWNER') return 'LANDOWNER'
  return 'OPERATOR'
}

export function resolveUserRole(user: any): 'admin' | 'operator' | 'landowner' {
  const normalized = (user?.role || '').toLowerCase()
  if (normalized === 'admin') return 'admin'
  if (normalized === 'landowner') return 'landowner'
  return 'operator'
}

export function resolveUserDisplayName(user: any): string {
  if (!user) return 'Unknown'
  const profile = user.operatorProfile || user.landownerProfile
  return profile?.fullName || user.fullName || user.email || 'Unknown'
}

// --------------- document helpers (used by service actions) ---------------
export function extractDocumentName(fileKey: string): string {
  const rawName = fileKey.split('/').pop() || fileKey
  return decodeURIComponent(rawName.split('::')[0] || rawName)
}

export function extractDocumentSize(fileKey: string): string {
  const sizePart = fileKey.split('::')[1]
  return sizePart ? decodeURIComponent(sizePart) : 'Unknown'
}

export function buildDocumentFileKey(
  incidentId: string,
  fileName: string,
  fileSize?: string,
): string {
  const safeName = encodeURIComponent(fileName.trim().replace(/\s+/g, '-'))
  const sizePart = encodeURIComponent(fileSize || 'Unknown')
  return `${incidentId}/${safeName}::${sizePart}`
}

// --------------- serialisers (base) ---------------
export function serializeIncidentMessage(message: any) {
  return {
    id: message.id,
    role: resolveUserRole(message.sender),
    sender: resolveUserDisplayName(message.sender),
    text: message.messageText,
    visibility: message.visibility || 'reporter',
    timestamp: message.createdAt?.toISOString?.() || message.createdAt,
  }
}

export function serializeIncidentDocument(document: any) {
  return {
    id: document.id,
    name: document.fileName || extractDocumentName(document.fileKey),
    type: document.documentType || 'FILE',
    size: document.fileSize || extractDocumentSize(document.fileKey),
    url: document.fileKey,
    uploadedAt: document.uploadedAt?.toISOString?.() || document.uploadedAt,
    uploadedBy: resolveUserDisplayName(document.uploader),
    messageId: document.messageId || null,
  }
}

export function serializeIncident(
  incident: any,
  viewerRole: 'admin' | 'operator' | 'landowner' = 'admin',
) {
  const siteLandowner = incident.site?.landowner || null
  const reporter = incident.reporter || null
  const bookingOperator = incident.booking?.operator || null
  const reporterRole = resolveUserRole(reporter)
  const reporterName = resolveUserDisplayName(reporter)
  const messages = (incident.messages || [])
    .filter((message: any) => {
      if (viewerRole === 'admin') return true
      if (message.visibility === 'internal') return false
      if (viewerRole === 'landowner') return message.visibility === 'target'
      return message.visibility === 'reporter'
    })
    .map(serializeIncidentMessage)
  const documents = (incident.documents || []).map(serializeIncidentDocument)

  return {
    id: incident.id,
    vaId: incident.vaId || null,
    landownerId: incident.site?.landownerId || null,
    landownerName: resolveUserDisplayName(siteLandowner),
    siteId: incident.siteId,
    siteName: incident.site?.name || '',
    bookingId: incident.bookingId || undefined,
    operatorId: incident.booking?.operatorId || null,
    operatorName:
      resolveUserDisplayName(bookingOperator) ||
      (reporterRole === 'operator' ? reporterName : undefined),
    type: incident.incidentType,
    description: incident.description,
    urgency: incident.urgency,
    estimatedDamage: incident.estimatedDamage
      ? Number(incident.estimatedDamage.toString())
      : undefined,
    status: incident.status,
    adminNotes: incident.adminNotes || undefined,
    decision: null, // will be enriched by caller when needed
    messages:
      messages.length > 0
        ? messages
        : [
            {
              id: `${incident.id}-message-0`,
              role: reporterRole,
              sender: reporterName,
              text: incident.description,
              timestamp:
                incident.createdAt?.toISOString?.() || incident.createdAt,
              visibility: 'reporter',
              attachments: [],
            },
          ],
    relatedDocumentation: documents,
    createdAt: incident.createdAt?.toISOString?.() || incident.createdAt,
    resolvedAt:
      incident.resolvedAt?.toISOString?.() || incident.resolvedAt || undefined,
    incidentDateTime:
      incident.incidentDateTime?.toISOString?.() ||
      incident.incidentDateTime ||
      undefined,
    insuranceNotified: incident.insuranceNotified,
    immediateActionTaken: incident.immediateActionTaken || undefined,
    reporterId: incident.reporterId,
  }
}

// Prisma include used everywhere
export const incidentInclude = {
  site: {
    include: {
      landowner: {
        include: {
          operatorProfile: true,
          landownerProfile: true,
        },
      },
    },
  },
  reporter: {
    include: {
      operatorProfile: true,
      landownerProfile: true,
    },
  },
  booking: {
    include: {
      operator: {
        include: {
          operatorProfile: true,
          landownerProfile: true,
        },
      },
    },
  },
  decisionUser: {
    include: {
      operatorProfile: true,
      landownerProfile: true,
    },
  },
  sanctionTarget: {
    include: {
      operatorProfile: true,
      landownerProfile: true,
    },
  },
  documents: {
    include: {
      uploader: {
        include: {
          operatorProfile: true,
          landownerProfile: true,
        },
      },
    },
    orderBy: { uploadedAt: 'asc' },
  },
  messages: {
    include: {
      sender: {
        include: {
          operatorProfile: true,
          landownerProfile: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} as const
