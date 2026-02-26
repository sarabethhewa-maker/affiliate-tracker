-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN     "historicalConversions" INTEGER DEFAULT 0,
ADD COLUMN     "historicalRevenue" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "importSource" TEXT;
