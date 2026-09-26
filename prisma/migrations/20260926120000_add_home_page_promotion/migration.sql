-- CreateTable
CREATE TABLE "HomePagePromotion" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "productId" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePagePromotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomePagePromotion_productId_idx" ON "HomePagePromotion"("productId");

-- CreateIndex
CREATE INDEX "HomePagePromotion_sortOrder_idx" ON "HomePagePromotion"("sortOrder");

-- AddForeignKey
ALTER TABLE "HomePagePromotion" ADD CONSTRAINT "HomePagePromotion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
