-- CreateTable
CREATE TABLE "FraudFlag" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FraudFlag_affiliateId_idx" ON "FraudFlag"("affiliateId");
CREATE INDEX "FraudFlag_resolved_idx" ON "FraudFlag"("resolved");

-- AddForeignKey
ALTER TABLE "FraudFlag" ADD CONSTRAINT "FraudFlag_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
