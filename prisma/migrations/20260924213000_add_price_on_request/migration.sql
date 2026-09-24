-- AlterTable
ALTER TABLE "Product" ADD COLUMN "priceOnRequest" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PriceRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceRequest_productId_idx" ON "PriceRequest"("productId");

-- CreateIndex
CREATE INDEX "PriceRequest_userId_idx" ON "PriceRequest"("userId");

-- AddForeignKey
ALTER TABLE "PriceRequest" ADD CONSTRAINT "PriceRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceRequest" ADD CONSTRAINT "PriceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
