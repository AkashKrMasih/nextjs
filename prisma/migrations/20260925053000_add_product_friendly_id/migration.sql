-- AlterTable
ALTER TABLE "Product" ADD COLUMN "friendly_id" TEXT;

-- Backfill from the product title, and append the id so existing rows stay unique.
UPDATE "Product"
SET "friendly_id" = trim(both '-' from lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || id::text
WHERE "friendly_id" IS NULL;

UPDATE "Product"
SET "friendly_id" = 'product-' || id::text
WHERE "friendly_id" IS NULL OR "friendly_id" = '';

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "friendly_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_friendly_id_key" ON "Product"("friendly_id");
