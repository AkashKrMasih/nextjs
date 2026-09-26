-- CreateTable
CREATE TABLE "ProductReport" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductReport_productId_idx" ON "ProductReport"("productId");

-- CreateIndex
CREATE INDEX "ProductReport_userId_idx" ON "ProductReport"("userId");

-- AddForeignKey
ALTER TABLE "ProductReport" ADD CONSTRAINT "ProductReport_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReport" ADD CONSTRAINT "ProductReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
