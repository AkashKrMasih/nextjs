/*
  Warnings:

  - You are about to drop the `AttributeValue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AttributeValue" DROP CONSTRAINT "AttributeValue_attributeId_fkey";

-- AlterTable
ALTER TABLE "ProductAttribute" ADD COLUMN     "value" TEXT;

-- DropTable
DROP TABLE "AttributeValue";
