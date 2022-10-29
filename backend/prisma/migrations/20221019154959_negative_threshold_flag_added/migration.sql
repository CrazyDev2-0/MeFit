-- AlterTable
ALTER TABLE "PersonalizedMonitoring" ADD COLUMN     "isCalorieCount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isMonitorStepCount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minCalorieCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minStepCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "VitalThreshold" ADD COLUMN     "isNegativeThreshold" BOOLEAN NOT NULL DEFAULT false;
