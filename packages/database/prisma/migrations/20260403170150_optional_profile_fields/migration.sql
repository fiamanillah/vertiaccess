-- AlterTable
ALTER TABLE "landowner_profiles" ALTER COLUMN "contact_phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "operator_profiles" ALTER COLUMN "contact_phone" DROP NOT NULL,
ALTER COLUMN "flyer_id" DROP NOT NULL;
