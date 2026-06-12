import { db } from '@vertiaccess/database'
import { Prisma } from '@vertiaccess/database/generated/prisma/client'

export type AuditEntityType = 'site' | 'booking' | 'incident' | 'user' | 'payment'
export type AuditActorType = 'operator' | 'assetmanager' | 'admin' | 'system'

export interface RecordAuditLogInput {
  siteId?: string | null
  entityType: AuditEntityType
  entityId: string
  eventType: string
  actorType: AuditActorType
  actorId: string
  previousState?: unknown
  newState?: unknown
  metadata?: Record<string, unknown> | null
}

type AuditLogWriter = {
  auditLog?: {
    create?: (args: { data: Record<string, any> }) => Promise<unknown>
  }
}

/**
 * Utility to record an audit log event to the database.
 * Supports running within a transaction tx or directly on the global db client.
 */
export async function recordAuditLog(
  tx: AuditLogWriter | undefined,
  input: RecordAuditLogInput,
): Promise<unknown> {
  const createFn =
    tx &&
    tx.auditLog &&
    typeof tx.auditLog.create === 'function'
      ? tx.auditLog.create.bind(tx.auditLog)
      : db.auditLog.create.bind(db.auditLog)

  // Generate a unique event ID matching "event_id" format
  const randomSuffix = Math.random().toString(36).substring(2, 11)
  const eventId = `evt-${randomSuffix}-${Date.now()}`

  return createFn({
    data: {
      eventId,
      siteId: input.siteId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId,
      previousState:
        input.previousState === undefined
          ? undefined
          : (input.previousState ?? Prisma.JsonNull),
      newState:
        input.newState === undefined
          ? undefined
          : (input.newState ?? Prisma.JsonNull),
      metadata:
        input.metadata === undefined
          ? undefined
          : (input.metadata ?? Prisma.JsonNull),
    } as any,
  })
}
