-- AlterTable
ALTER TABLE "VitalThreshold" ADD COLUMN     "maxAge" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minAge" INTEGER NOT NULL DEFAULT 0;
