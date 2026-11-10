-- CreateTable
CREATE TABLE "landing_pages" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'tr',
    "html" TEXT NOT NULL,
    "captures_submit" BOOLEAN NOT NULL DEFAULT true,
    "training_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_modules" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'tr',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "quiz" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_completions" (
    "id" TEXT NOT NULL,
    "campaign_target_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "score" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "landing_pages_org_id_idx" ON "landing_pages"("org_id");

-- CreateIndex
CREATE INDEX "training_modules_org_id_idx" ON "training_modules"("org_id");

-- CreateIndex
CREATE INDEX "training_completions_campaign_target_id_idx" ON "training_completions"("campaign_target_id");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_landing_page_id_fkey" FOREIGN KEY ("landing_page_id") REFERENCES "landing_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "training_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_modules" ADD CONSTRAINT "training_modules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_campaign_target_id_fkey" FOREIGN KEY ("campaign_target_id") REFERENCES "campaign_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "training_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

