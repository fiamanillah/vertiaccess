export type BookingLifecycleActorType =
  | 'operator'
  | 'landowner'
  | 'admin'
  | 'system'

type BookingLifecycleWriter = {
  bookingLifecycleEvent: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  }
}

export async function recordBookingLifecycleEvent(
  tx: BookingLifecycleWriter,
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
  return tx.bookingLifecycleEvent.create({
    data: {
      bookingId: input.bookingId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId ?? 'system',
      previousState: input.previousState ?? null,
      newState: input.newState ?? null,
      metadata: input.metadata ?? null,
    },
  })
}
