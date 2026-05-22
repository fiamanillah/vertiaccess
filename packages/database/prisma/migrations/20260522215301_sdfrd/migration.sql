-- AlterTable
ALTER TABLE "IncidentDocument" ADD COLUMN     "messageId" TEXT;

-- AddForeignKey
ALTER TABLE "IncidentDocument" ADD CONSTRAINT "IncidentDocument_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "IncidentMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
