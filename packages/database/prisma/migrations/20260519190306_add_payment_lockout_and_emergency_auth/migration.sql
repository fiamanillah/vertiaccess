-- AlterEnum
ALTER TYPE "AccountStatus" ADD VALUE 'PAYMENT_LOCKED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'authorized';
ALTER TYPE "PaymentStatus" ADD VALUE 'pending_charge';
ALTER TYPE "PaymentStatus" ADD VALUE 'failed';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "emergencyAuthAgreedAt" TIMESTAMP(3),
ADD COLUMN     "emergencyAuthAmount" DECIMAL(10,2),
ADD COLUMN     "emergencyAuthCardLast4" VARCHAR(4);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "overdueBookingId" TEXT,
ADD COLUMN     "paymentLockedAt" TIMESTAMP(3),
ADD COLUMN     "paymentLockedReason" TEXT;
