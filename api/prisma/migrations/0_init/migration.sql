-- CreateEnum
CREATE TYPE "Role" AS ENUM ('super_admin', 'org_admin', 'security_analyst');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('tr', 'en');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('sent', 'opened', 'clicked', 'submitted', 'reported', 'trained');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "verified_domain" TEXT,
    "data_retention_days" INTEGER NOT NULL DEFAULT 180,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'org_admin',
    "totp_secret" TEXT,
    "failed_logins" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "targets" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "department" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'tr',
    "groups" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'tr',
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "landing_page_id" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "drip_per_min" INTEGER NOT NULL DEFAULT 20,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_targets" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "campaign_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "campaign_target_id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_org_id_idx" ON "users"("org_id");

-- CreateIndex
CREATE INDEX "targets_org_id_idx" ON "targets"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "targets_org_id_email_key" ON "targets"("org_id", "email");

-- CreateIndex
CREATE INDEX "email_templates_org_id_idx" ON "email_templates"("org_id");

-- CreateIndex
CREATE INDEX "campaigns_org_id_idx" ON "campaigns"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_targets_token_key" ON "campaign_targets"("token");

-- CreateIndex
CREATE INDEX "campaign_targets_campaign_id_idx" ON "campaign_targets"("campaign_id");

-- CreateIndex
CREATE INDEX "events_campaign_target_id_idx" ON "events"("campaign_target_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "targets" ADD CONSTRAINT "targets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_targets" ADD CONSTRAINT "campaign_targets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_targets" ADD CONSTRAINT "campaign_targets_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_campaign_target_id_fkey" FOREIGN KEY ("campaign_target_id") REFERENCES "campaign_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

