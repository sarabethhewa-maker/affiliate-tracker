-- CreateTable
CREATE TABLE "GeneratedLink" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "trackedUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedLink_affiliateId_idx" ON "GeneratedLink"("affiliateId");

-- AddForeignKey
ALTER TABLE "GeneratedLink" ADD CONSTRAINT "GeneratedLink_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
