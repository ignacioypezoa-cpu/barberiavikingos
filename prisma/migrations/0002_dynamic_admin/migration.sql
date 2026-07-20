ALTER TABLE "Service"
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Barbería';

ALTER TABLE "Product"
ADD COLUMN "sku" TEXT;

UPDATE "Product"
SET "sku" = 'SKU-' || UPPER(SUBSTRING(md5("id"), 1, 10))
WHERE "sku" IS NULL;

ALTER TABLE "Product"
ALTER COLUMN "sku" SET NOT NULL;

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

ALTER TABLE "BusinessConfig"
ADD COLUMN "logo" TEXT,
ADD COLUMN "primaryColor" TEXT NOT NULL DEFAULT '#c49a5a',
ADD COLUMN "facebook" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "heroTitle" TEXT NOT NULL DEFAULT 'Tu estilo. Nuestro oficio.',
ADD COLUMN "heroSubtitle" TEXT NOT NULL DEFAULT 'Una experiencia de barbería diseñada al detalle.',
ADD COLUMN "heroImage" TEXT,
ADD COLUMN "generalHours" TEXT;
