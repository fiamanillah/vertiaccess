-- CreateEnum
CREATE TYPE "IncidentMessageVisibility" AS ENUM ('reporter', 'target', 'internal');

-- CreateEnum
CREATE TYPE "IncidentDecisionAction" AS ENUM ('no_action', 'warning', 'temporary_suspend', 'ban');

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "decisionAction" "IncidentDecisionAction",
ADD COLUMN     "decisionAt" TIMESTAMP(3),
ADD COLUMN     "decisionBy" TEXT,
ADD COLUMN     "decisionDurationDays" INTEGER,
ADD COLUMN     "decisionReason" TEXT,
ADD COLUMN     "decisionTargetId" TEXT,
ADD COLUMN     "decisionTargetRole" "UserRole";

-- AlterTable
ALTER TABLE "IncidentMessage" ADD COLUMN     "visibility" "IncidentMessageVisibility" NOT NULL DEFAULT 'reporter';

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_decisionBy_fkey" FOREIGN KEY ("decisionBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_decisionTargetId_fkey" FOREIGN KEY ("decisionTargetId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
