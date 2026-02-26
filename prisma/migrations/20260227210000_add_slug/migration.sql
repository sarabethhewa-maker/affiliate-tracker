-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN "slug" TEXT;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Affiliate_slug_key" ON "Affiliate"("slug");
