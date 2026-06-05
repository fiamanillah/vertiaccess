import { db } from '@vertiaccess/database'
import { Prisma } from '@vertiaccess/database/generated/prisma/client'

export type BookingLifecycleActorType =
  | 'operator'
  | 'assetowner'
  | 'admin'
  | 'system'

type BookingLifecycleWriter = {
  bookingLifecycleEvent?: {
    create?: (args: { data: Record<string, unknown> }) => Promise<unknown>
  }
}

export async function recordBookingLifecycleEvent(
  tx: BookingLifecycleWriter | undefined,
  input: {
    bookingId: string
    eventType: string
    actorType: BookingLifecycleActorType
    actorId?: string | null
    previousState?: unknown
    newState?: unknown
    metadata?: Record<string, unknown> | null
  },
) {
  const createFn =
    tx &&
    tx.bookingLifecycleEvent &&
    typeof tx.bookingLifecycleEvent.create === 'function'
      ? tx.bookingLifecycleEvent.create.bind(tx.bookingLifecycleEvent)
      : db.bookingLifecycleEvent.create.bind(db.bookingLifecycleEvent)

  return createFn({
    // Cast to any because generated Prisma JSON input types are strict
    // and can be difficult to express from Record<string, unknown>.
    data: {
      bookingId: input.bookingId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId ?? 'system',
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
