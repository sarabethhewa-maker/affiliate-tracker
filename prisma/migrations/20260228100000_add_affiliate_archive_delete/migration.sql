-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN "archivedAt" TIMESTAMP(3), ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Click - cascade delete when affiliate is deleted
ALTER TABLE "Click" DROP CONSTRAINT IF EXISTS "Click_affiliateId_fkey";
ALTER TABLE "Click" ADD CONSTRAINT "Click_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Conversion - cascade delete
ALTER TABLE "Conversion" DROP CONSTRAINT IF EXISTS "Conversion_affiliateId_fkey";
ALTER TABLE "Conversion" ADD CONSTRAINT "Conversion_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Payout - cascade delete
ALTER TABLE "Payout" DROP CONSTRAINT IF EXISTS "Payout_affiliateId_fkey";
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
