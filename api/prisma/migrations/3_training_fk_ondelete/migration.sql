-- DropForeignKey
ALTER TABLE "training_completions" DROP CONSTRAINT "training_completions_module_id_fkey";

-- AddForeignKey
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

