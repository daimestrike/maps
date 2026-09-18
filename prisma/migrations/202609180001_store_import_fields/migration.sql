ALTER TABLE "Store"
  ADD COLUMN "territory" TEXT,
  ADD COLUMN "macroregion" TEXT,
  ADD COLUMN "division" TEXT,
  ADD COLUMN "cluster" TEXT,
  ADD COLUMN "cfo" TEXT,
  ADD COLUMN "costCenter" TEXT,
  ADD COLUMN "sapPlant" TEXT,
  ADD COLUMN "formatCode" TEXT,
  ADD COLUMN "formatName" TEXT,
  ADD COLUMN "legalEntity" TEXT,
  ADD COLUMN "metro" TEXT,
  ADD COLUMN "openingHours" TEXT,
  ADD COLUMN "coordinatesApproximate" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Store_sapPlant_key" ON "Store"("sapPlant");
