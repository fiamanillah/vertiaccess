-- CreateTable
CREATE TABLE "BookingLifecycleEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "previousState" JSONB,
    "newState" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingLifecycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingLifecycleEvent_bookingId_idx" ON "BookingLifecycleEvent"("bookingId");

-- CreateIndex
CREATE INDEX "BookingLifecycleEvent_eventType_idx" ON "BookingLifecycleEvent"("eventType");

-- CreateIndex
CREATE INDEX "BookingLifecycleEvent_createdAt_idx" ON "BookingLifecycleEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "BookingLifecycleEvent" ADD CONSTRAINT "BookingLifecycleEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
