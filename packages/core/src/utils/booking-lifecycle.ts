import { db } from '@vertiaccess/database'
import { Prisma } from '@vertiaccess/database/generated/prisma/client'

export type BookingLifecycleActorType =
  | 'operator'
  | 'assetmanager'
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

export async function autoUpdateBookingStatuses(): Promise<void> {
  const now = new Date()

  // 1. APPROVED -> ACTIVATED
  // Transition approved bookings to ACTIVATED if start time is reached and end time is in the future
  await db.booking.updateMany({
    where: {
      status: 'APPROVED',
      startTime: { lte: now },
      endTime: { gt: now },
    },
    data: {
      status: 'ACTIVATED',
    },
  })

  // 2. ACTIVATED (or APPROVED) -> COMPLETED
  // Transition activated/approved bookings to COMPLETED if end time is reached
  await db.booking.updateMany({
    where: {
      status: { in: ['ACTIVATED', 'APPROVED'] },
      endTime: { lte: now },
    },
    data: {
      status: 'COMPLETED',
    },
  })

  // 3. PENDING -> EXPIRED
  // Transition pending bookings to EXPIRED if end time has passed
  await db.booking.updateMany({
    where: {
      status: 'PENDING',
      endTime: { lte: now },
    },
    data: {
      status: 'EXPIRED',
    },
  })
}
