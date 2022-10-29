-- AlterTable
ALTER TABLE "DetectionHistory" ALTER COLUMN "detectedOn" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "DeviceUserLink" ALTER COLUMN "linkedOn" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "DisorderHistory" ALTER COLUMN "foundOn" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "PersonalizedMonitoring" ALTER COLUMN "intervalSeconds" SET DATA TYPE BIGINT,
ALTER COLUMN "registeredOn" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "VitalData" ALTER COLUMN "timestamp" SET DATA TYPE BIGINT;
