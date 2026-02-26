-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN "historicalGrossConversions" INTEGER DEFAULT 0;
ALTER TABLE "Affiliate" ADD COLUMN "historicalApprovedConversions" INTEGER DEFAULT 0;
ALTER TABLE "Affiliate" ADD COLUMN "historicalRejectedConversions" INTEGER DEFAULT 0;
ALTER TABLE "Affiliate" ADD COLUMN "historicalPendingConversions" INTEGER DEFAULT 0;
ALTER TABLE "Affiliate" ADD COLUMN "historicalPayout" DOUBLE PRECISION DEFAULT 0;
