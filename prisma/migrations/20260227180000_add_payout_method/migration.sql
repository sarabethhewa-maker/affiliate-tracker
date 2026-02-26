-- AlterTable Payout: add method column (schema had it; migration was missing)
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "method" TEXT NOT NULL DEFAULT 'other';
