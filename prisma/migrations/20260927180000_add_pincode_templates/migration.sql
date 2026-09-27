-- CreateTable
CREATE TABLE "PincodeTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PincodeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PincodeTemplateEntry" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "PincodeTemplateEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDeliveryPincode" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "ProductDeliveryPincode_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "pincodeTemplateId" TEXT;

-- CreateIndex
CREATE INDEX "Product_pincodeTemplateId_idx" ON "Product"("pincodeTemplateId");

-- CreateIndex
CREATE INDEX "PincodeTemplateEntry_templateId_idx" ON "PincodeTemplateEntry"("templateId");

-- CreateIndex
CREATE INDEX "PincodeTemplateEntry_code_idx" ON "PincodeTemplateEntry"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PincodeTemplateEntry_templateId_code_key" ON "PincodeTemplateEntry"("templateId", "code");

-- CreateIndex
CREATE INDEX "ProductDeliveryPincode_productId_idx" ON "ProductDeliveryPincode"("productId");

-- CreateIndex
CREATE INDEX "ProductDeliveryPincode_code_idx" ON "ProductDeliveryPincode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDeliveryPincode_productId_code_key" ON "ProductDeliveryPincode"("productId", "code");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_pincodeTemplateId_fkey" FOREIGN KEY ("pincodeTemplateId") REFERENCES "PincodeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PincodeTemplateEntry" ADD CONSTRAINT "PincodeTemplateEntry_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PincodeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDeliveryPincode" ADD CONSTRAINT "ProductDeliveryPincode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
