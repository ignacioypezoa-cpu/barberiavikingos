-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "publicToken" TEXT,
ADD COLUMN     "reminder24hSentAt" TIMESTAMP(3),
ADD COLUMN     "reminder2hSentAt" TIMESTAMP(3),
ADD COLUMN     "reminder30mSentAt" TIMESTAMP(3),
ADD COLUMN     "reviewRequestedAt" TIMESTAMP(3);

UPDATE "Appointment"
SET "publicToken" = md5("id" || "code" || random()::text)
WHERE "publicToken" IS NULL;

ALTER TABLE "Appointment" ALTER COLUMN "publicToken" SET NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "accessCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "accessCodeHash" TEXT,
ADD COLUMN     "favoriteBarber" TEXT,
ADD COLUMN     "favoriteCut" TEXT,
ADD COLUMN     "favoriteProducts" TEXT,
ADD COLUMN     "firstVisitAt" TIMESTAMP(3),
ADD COLUMN     "lastVisitAt" TIMESTAMP(3),
ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preferences" TEXT,
ADD COLUMN     "totalSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visitCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AppointmentBlock" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "barberId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MANUAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "barberId" TEXT,
    "desiredAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visits" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "rewardType" TEXT NOT NULL,
    "rewardValue" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvancedConfig" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "remindersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminder24hEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminder2hEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminder30mEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rescheduleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cancelEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minimumChangeHours" INTEGER NOT NULL DEFAULT 2,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "loyaltyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pointsPerVisit" INTEGER NOT NULL DEFAULT 10,
    "pointsPerPurchaseRate" INTEGER NOT NULL DEFAULT 1000,
    "reviewsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "googleCalendarEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvancedConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentBlock_branchId_startAt_endAt_idx" ON "AppointmentBlock"("branchId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "AppointmentBlock_barberId_startAt_endAt_idx" ON "AppointmentBlock"("barberId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_desiredAt_status_idx" ON "WaitlistEntry"("desiredAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_appointmentId_key" ON "Review"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_publicToken_key" ON "Appointment"("publicToken");

-- AddForeignKey
ALTER TABLE "AppointmentBlock" ADD CONSTRAINT "AppointmentBlock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentBlock" ADD CONSTRAINT "AppointmentBlock_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
