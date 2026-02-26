-- AlterTable
ALTER TABLE "Conversion" ADD COLUMN "orderId" TEXT;
ALTER TABLE "Conversion" ADD COLUMN "source" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Conversion_orderId_key" ON "Conversion"("orderId");
