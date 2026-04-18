-- Migration: add_human_ids_cert_id_card_snapshot
-- Adds human-readable IDs (va-xxx-xxxxxxx) to Site and Booking,
-- VA-CERT-XXXXX certId to ConsentCertificate,
-- and payment card snapshot columns to Booking for masked display.

-- Site: human-readable display ID
ALTER TABLE "Site" ADD COLUMN "humanId" TEXT;
CREATE UNIQUE INDEX "Site_humanId_key" ON "Site"("humanId");

-- Booking: human-readable display ID
ALTER TABLE "Booking" ADD COLUMN "humanId" TEXT;
CREATE UNIQUE INDEX "Booking_humanId_key" ON "Booking"("humanId");

-- Booking: payment card snapshot at time of booking (for masked display in UI)
ALTER TABLE "Booking" ADD COLUMN "paymentMethodLast4" VARCHAR(4);
ALTER TABLE "Booking" ADD COLUMN "paymentMethodBrand" TEXT;

-- ConsentCertificate: human-readable certificate ID (VA-CERT-XXXXX)
ALTER TABLE "ConsentCertificate" ADD COLUMN "certId" TEXT;
CREATE UNIQUE INDEX "ConsentCertificate_certId_key" ON "ConsentCertificate"("certId");
