-- AlterEnum
ALTER TYPE "AccountStatus" ADD VALUE 'BANNED';

-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "rejectionReason" TEXT;
