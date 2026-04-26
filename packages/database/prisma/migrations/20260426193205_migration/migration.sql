/*
  Warnings:

  - You are about to drop the column `humanId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `certId` on the `ConsentCertificate` table. All the data in the column will be lost.
  - You are about to drop the column `humanId` on the `Site` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vtId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vtId]` on the table `ConsentCertificate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vtId]` on the table `Incident` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vtId]` on the table `LandownerProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vtId]` on the table `OperatorProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vtId]` on the table `Site` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vtId]` on the table `Verification` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Booking_humanId_key";

-- DropIndex
DROP INDEX "ConsentCertificate_certId_key";

-- DropIndex
DROP INDEX "Site_humanId_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "humanId",
ADD COLUMN     "vtId" TEXT;

-- AlterTable
ALTER TABLE "ConsentCertificate" DROP COLUMN "certId",
ADD COLUMN     "vtId" TEXT;

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "vtId" TEXT;

-- AlterTable
ALTER TABLE "LandownerProfile" ADD COLUMN     "vtId" TEXT;

-- AlterTable
ALTER TABLE "OperatorProfile" ADD COLUMN     "vtId" TEXT;

-- AlterTable
ALTER TABLE "Site" DROP COLUMN "humanId",
ADD COLUMN     "vtId" TEXT;

-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "vtId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_vtId_key" ON "Booking"("vtId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentCertificate_vtId_key" ON "ConsentCertificate"("vtId");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_vtId_key" ON "Incident"("vtId");

-- CreateIndex
CREATE UNIQUE INDEX "LandownerProfile_vtId_key" ON "LandownerProfile"("vtId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorProfile_vtId_key" ON "OperatorProfile"("vtId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_vtId_key" ON "Site"("vtId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_vtId_key" ON "Verification"("vtId");
