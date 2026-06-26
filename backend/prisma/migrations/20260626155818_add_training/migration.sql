-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "is_in_training_set" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "training_set_added_at" TIMESTAMP(6);
