-- AlterTable Affiliate: add state, referralCode
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Affiliate_referralCode_key" ON "Affiliate"("referralCode") WHERE "referralCode" IS NOT NULL;

-- AlterTable Conversion: add note, status, product, paidAt if not exists
ALTER TABLE "Conversion" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "Conversion" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending';
ALTER TABLE "Conversion" ADD COLUMN IF NOT EXISTS "product" TEXT;
ALTER TABLE "Conversion" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

-- CreateTable Payout
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Payout_affiliateId_idx" ON "Payout"("affiliateId");

ALTER TABLE "Payout" ADD CONSTRAINT "Payout_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
