-- AlterTable
ALTER TABLE "Conversion" ADD COLUMN "orderNumber" TEXT,
ADD COLUMN "orderStatus" TEXT,
ADD COLUMN "orderItems" JSONB,
ADD COLUMN "customerName" TEXT,
ADD COLUMN "customerCity" TEXT;
