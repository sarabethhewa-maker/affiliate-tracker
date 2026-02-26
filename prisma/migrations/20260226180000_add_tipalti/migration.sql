-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN "tipaltiPayeeId" TEXT;
ALTER TABLE "Affiliate" ADD COLUMN "tipaltiStatus" TEXT;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN "tipaltiRefCode" TEXT;
ALTER TABLE "Payout" ADD COLUMN "payoutStatus" TEXT DEFAULT 'pending';
