-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'LANDOWNER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('UNDER_REVIEW', 'ACTIVE', 'DISABLE', 'TEMPORARY_RESTRICTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "SiteCategory" AS ENUM ('private_land', 'helipad', 'vertiport', 'droneport', 'temporary_landing_site');

-- CreateEnum
CREATE TYPE "SiteType" AS ENUM ('toal', 'emergency');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UseCategory" AS ENUM ('planned_toal', 'emergency_recovery');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('standard', 'bvlos');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'charged', 'refunded', 'cancelled_no_charge', 'cancelled_partial', 'cancelled_full');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "IncidentUrgency" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('landowner', 'operator', 'site');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "suspended_at" TIMESTAMP(3),
    "suspended_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_profiles" (
    "user_id" TEXT NOT NULL,
    "operator_reference" TEXT,
    "full_name" TEXT NOT NULL,
    "organisation" TEXT,
    "contact_phone" TEXT NOT NULL,
    "flyer_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "landowner_profiles" (
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "organisation" TEXT,
    "contact_phone" TEXT NOT NULL,
    "stripe_account_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landowner_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_price" DECIMAL(65,30) NOT NULL,
    "annual_price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "stripe_product_id" TEXT,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_payment_method_id" TEXT NOT NULL,
    "last4" VARCHAR(4) NOT NULL,
    "brand" TEXT NOT NULL,
    "expiry_month" VARCHAR(2) NOT NULL,
    "expiry_year" VARCHAR(4) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "booking_id" UUID,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "transaction_type" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "pricing_breakdown" JSONB,
    "stripe_charge_id" TEXT,
    "idempotency_key" TEXT,
    "receipt_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" UUID NOT NULL,
    "landowner_id" TEXT NOT NULL,
    "site_reference" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "site_type" "SiteType",
    "site_category" "SiteCategory",
    "address" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "validity_start" TIMESTAMP(3) NOT NULL,
    "validity_end" TIMESTAMP(3),
    "auto_approve" BOOLEAN NOT NULL DEFAULT false,
    "exclusive_use" BOOLEAN NOT NULL DEFAULT false,
    "emergency_recovery_enabled" BOOLEAN NOT NULL DEFAULT false,
    "clz_enabled" BOOLEAN NOT NULL DEFAULT false,
    "center_point" geometry(Point, 4326),
    "boundary_polygon" geometry(Polygon, 4326),
    "clz_polygon" geometry(Polygon, 4326),
    "geometry_metadata" JSONB,
    "hourly_rate" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "cancellation_fee_percentage" DECIMAL(65,30),
    "toal_access_fee" DECIMAL(65,30),
    "clz_access_fee" DECIMAL(65,30),
    "status" "SiteStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_service_tiers" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "tier_name" TEXT NOT NULL,

    CONSTRAINT "site_service_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_services" (
    "id" UUID NOT NULL,
    "tier_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "site_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_documents" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "document_type" TEXT,
    "file_name" TEXT,
    "file_key" TEXT NOT NULL,
    "file_size" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "operator_id" TEXT NOT NULL,
    "site_id" UUID NOT NULL,
    "booking_reference" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "operation_reference" TEXT,
    "drone_model" TEXT,
    "mission_intent" TEXT,
    "use_category" "UseCategory" NOT NULL,
    "operation_type" "OperationType",
    "clz_used" BOOLEAN,
    "clz_confirmed_at" TIMESTAMP(3),
    "is_payg" BOOLEAN NOT NULL DEFAULT false,
    "platform_fee" DECIMAL(65,30),
    "toal_cost" DECIMAL(65,30),
    "cancellation_fee" DECIMAL(65,30),
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "payment_status" "PaymentStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_documents" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "document_type" TEXT,
    "file_name" TEXT,
    "file_key" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_certificates" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "certificate_type" TEXT NOT NULL DEFAULT 'Digital Land Access Consent',
    "issue_date" TIMESTAMP(3) NOT NULL,
    "verification_hash" TEXT NOT NULL,
    "digital_signature" TEXT NOT NULL,
    "verification_url" TEXT,
    "site_status_at_issue" TEXT,

    CONSTRAINT "consent_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "booking_id" UUID,
    "site_id" UUID NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "incident_type" TEXT NOT NULL,
    "urgency" "IncidentUrgency" NOT NULL,
    "description" TEXT NOT NULL,
    "incident_date_time" TIMESTAMP(3),
    "estimated_damage" DECIMAL(65,30),
    "immediate_action_taken" TEXT,
    "insurance_notified" BOOLEAN NOT NULL DEFAULT false,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_documents" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "document_type" TEXT,
    "file_key" TEXT NOT NULL,
    "uploaded_by" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_messages" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "related_entity_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" UUID NOT NULL,
    "type" "VerificationType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "user_id" TEXT,
    "site_id" UUID,
    "submitted_documents" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notes" (
    "id" UUID NOT NULL,
    "admin_id" TEXT NOT NULL,
    "target_user_id" TEXT,
    "note_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "changed_by" TEXT,
    "previous_status" "BookingStatus",
    "new_status" "BookingStatus" NOT NULL,
    "reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "operator_profiles_operator_reference_key" ON "operator_profiles"("operator_reference");

-- CreateIndex
CREATE UNIQUE INDEX "operator_profiles_stripe_customer_id_key" ON "operator_profiles"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "landowner_profiles_stripe_account_id_key" ON "landowner_profiles"("stripe_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripe_product_id_key" ON "subscription_plans"("stripe_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_user_id_key" ON "user_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_stripe_subscription_id_key" ON "user_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_stripe_payment_method_id_key" ON "payment_methods"("stripe_payment_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_stripe_charge_id_key" ON "transactions"("stripe_charge_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_idempotency_key_key" ON "transactions"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "sites_site_reference_key" ON "sites"("site_reference");

-- CreateIndex
CREATE INDEX "sites_landowner_id_idx" ON "sites"("landowner_id");

-- CreateIndex
CREATE INDEX "sites_status_idx" ON "sites"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_reference_key" ON "bookings"("booking_reference");

-- CreateIndex
CREATE INDEX "bookings_operator_id_idx" ON "bookings"("operator_id");

-- CreateIndex
CREATE INDEX "bookings_site_id_idx" ON "bookings"("site_id");

-- CreateIndex
CREATE INDEX "bookings_start_time_idx" ON "bookings"("start_time");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "consent_certificates_booking_id_key" ON "consent_certificates"("booking_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- AddForeignKey
ALTER TABLE "operator_profiles" ADD CONSTRAINT "operator_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landowner_profiles" ADD CONSTRAINT "landowner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_landowner_id_fkey" FOREIGN KEY ("landowner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_service_tiers" ADD CONSTRAINT "site_service_tiers_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_services" ADD CONSTRAINT "site_services_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "site_service_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_documents" ADD CONSTRAINT "site_documents_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_documents" ADD CONSTRAINT "booking_documents_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_certificates" ADD CONSTRAINT "consent_certificates_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_documents" ADD CONSTRAINT "incident_documents_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_documents" ADD CONSTRAINT "incident_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_messages" ADD CONSTRAINT "incident_messages_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_messages" ADD CONSTRAINT "incident_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
