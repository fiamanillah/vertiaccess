/*
  Warnings:

  - The values [standard,bvlos] on the enum `OperationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'ACTIVATED';
ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
BEGIN;
CREATE TYPE "OperationType_new" AS ENUM ('INBOUND', 'OUTBOUND');
ALTER TABLE "Booking" ALTER COLUMN "operationType" TYPE "OperationType_new" USING ("operationType"::text::"OperationType_new");
ALTER TYPE "OperationType" RENAME TO "OperationType_old";
ALTER TYPE "OperationType_new" RENAME TO "OperationType";
DROP TYPE "public"."OperationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Aircraft" ADD COLUMN     "icaoAddress" TEXT;
