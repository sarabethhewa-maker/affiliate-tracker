-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN "instagramUrl" TEXT,
ADD COLUMN "tiktokUrl" TEXT,
ADD COLUMN "youtubeUrl" TEXT,
ADD COLUMN "websiteUrl" TEXT,
ADD COLUMN "mailingAddress" TEXT,
ADD COLUMN "joinedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SlugHistory" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SlugHistory_oldSlug_idx" ON "SlugHistory"("oldSlug");

-- CreateIndex
CREATE INDEX "SlugHistory_affiliateId_idx" ON "SlugHistory"("affiliateId");

-- AddForeignKey
ALTER TABLE "SlugHistory" ADD CONSTRAINT "SlugHistory_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
