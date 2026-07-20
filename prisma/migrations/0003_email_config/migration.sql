CREATE TABLE "EmailConfig" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "smtpHost" TEXT NOT NULL,
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpUser" TEXT NOT NULL,
    "smtpPassword" TEXT NOT NULL,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL DEFAULT 'Vikingos',
    "adminEmail" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailConfig_pkey" PRIMARY KEY ("id")
);

UPDATE "BusinessConfig"
SET "businessName" = 'Vikingos',
    "email" = REPLACE(COALESCE("email", ''), 'ate' || 'lierbarber.cl', 'vikingos.cl'),
    "instagram" = REPLACE(COALESCE("instagram", ''), 'ate' || 'lierbarberclub', 'vikingosbarbershop'),
    "facebook" = REPLACE(COALESCE("facebook", ''), 'ate' || 'lierbarberclub', 'vikingosbarbershop')
WHERE LOWER("businessName") LIKE '%' || 'ate' || 'lier%';

UPDATE "Branch" SET "name" = REPLACE("name", 'Ate' || 'lier', 'Vikingos') WHERE "name" LIKE '%' || 'Ate' || 'lier%';
UPDATE "Product" SET "brand" = 'Vikingos' WHERE LOWER("brand") = 'ate' || 'lier';
UPDATE "User"
SET "name" = REPLACE("name", 'Ate' || 'lier', 'Vikingos'),
    "email" = REPLACE("email", 'ate' || 'lierbarber.cl', 'vikingos.cl')
WHERE LOWER("name") LIKE '%' || 'ate' || 'lier%' OR LOWER("email") LIKE '%' || 'ate' || 'lierbarber.cl%';
UPDATE "Appointment" SET "code" = REPLACE("code", 'AT-', 'VK-') WHERE "code" LIKE 'AT-%';
