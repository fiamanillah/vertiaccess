/*
  Warnings:

  - A unique constraint covering the columns `[clientRequestId]` on the table `Incident` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "clientRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Incident_clientRequestId_key" ON "Incident"("clientRequestId");
