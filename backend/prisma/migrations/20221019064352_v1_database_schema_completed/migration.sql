/*
  Warnings:

  - You are about to drop the `test` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('m', 'f');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('patient', 'doctor');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('ANeg', 'APos', 'BNeg', 'BPos', 'ABNeg', 'ABPos', 'ONeg', 'OPos');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- DropTable
DROP TABLE "test";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "otherDetails" JSONB NOT NULL DEFAULT '{}',
    "registeredOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "age" INTEGER NOT NULL DEFAULT 0,
    "gender" "Gender" NOT NULL DEFAULT 'm',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bmi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bloodGroup" "BloodGroup",
    "userId" TEXT NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalData" (
    "id" SERIAL NOT NULL,
    "val" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitalId" TEXT,
    "userId" TEXT,
    "timestamp" INTEGER NOT NULL,

    CONSTRAINT "VitalData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisorderHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "diseaseId" TEXT,
    "foundOn" INTEGER NOT NULL,

    CONSTRAINT "DisorderHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "diseaseId" TEXT,

    CONSTRAINT "FamilyHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalizedMonitoring" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "diseaseId" TEXT,
    "isPredictionModelAssigned" BOOLEAN NOT NULL DEFAULT false,
    "predictionModelId" TEXT,
    "assigneeType" "UserType" NOT NULL DEFAULT 'patient',
    "intervalSeconds" INTEGER NOT NULL DEFAULT 0,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "registeredOn" INTEGER NOT NULL,

    CONSTRAINT "PersonalizedMonitoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectionHistory" (
    "id" TEXT NOT NULL,
    "reportedBy" "UserType" NOT NULL DEFAULT 'patient',
    "reoprtedByName" TEXT,
    "cause" TEXT DEFAULT '',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'low',
    "userId" TEXT,
    "diseaseId" TEXT,
    "detectedOn" INTEGER NOT NULL,

    CONSTRAINT "DetectionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "canReceiveFromDevice" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Vital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disease" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Disease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalThreshold" (
    "id" TEXT NOT NULL,
    "vitalId" TEXT,
    "min" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate" INTEGER NOT NULL DEFAULT 0,
    "diseaseId" TEXT,
    "personalizedMonitoringId" TEXT,

    CONSTRAINT "VitalThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "diseaseId" TEXT,

    CONSTRAINT "PredictionModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionModelParam" (
    "id" TEXT NOT NULL,
    "manualEntryAllowed" BOOLEAN NOT NULL DEFAULT false,
    "vitalId" TEXT,
    "predictionModelId" TEXT,

    CONSTRAINT "PredictionModelParam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceUserLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "hardwareId" TEXT NOT NULL,
    "linkedOn" INTEGER NOT NULL,

    CONSTRAINT "DeviceUserLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceUserLink_userId_key" ON "DeviceUserLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceUserLink_hardwareId_key" ON "DeviceUserLink"("hardwareId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalData" ADD CONSTRAINT "VitalData_vitalId_fkey" FOREIGN KEY ("vitalId") REFERENCES "Vital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalData" ADD CONSTRAINT "VitalData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisorderHistory" ADD CONSTRAINT "DisorderHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisorderHistory" ADD CONSTRAINT "DisorderHistory_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyHistory" ADD CONSTRAINT "FamilyHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyHistory" ADD CONSTRAINT "FamilyHistory_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedMonitoring" ADD CONSTRAINT "PersonalizedMonitoring_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedMonitoring" ADD CONSTRAINT "PersonalizedMonitoring_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedMonitoring" ADD CONSTRAINT "PersonalizedMonitoring_predictionModelId_fkey" FOREIGN KEY ("predictionModelId") REFERENCES "PredictionModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectionHistory" ADD CONSTRAINT "DetectionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectionHistory" ADD CONSTRAINT "DetectionHistory_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalThreshold" ADD CONSTRAINT "VitalThreshold_vitalId_fkey" FOREIGN KEY ("vitalId") REFERENCES "Vital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalThreshold" ADD CONSTRAINT "VitalThreshold_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalThreshold" ADD CONSTRAINT "VitalThreshold_personalizedMonitoringId_fkey" FOREIGN KEY ("personalizedMonitoringId") REFERENCES "PersonalizedMonitoring"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionModel" ADD CONSTRAINT "PredictionModel_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionModelParam" ADD CONSTRAINT "PredictionModelParam_vitalId_fkey" FOREIGN KEY ("vitalId") REFERENCES "Vital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionModelParam" ADD CONSTRAINT "PredictionModelParam_predictionModelId_fkey" FOREIGN KEY ("predictionModelId") REFERENCES "PredictionModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceUserLink" ADD CONSTRAINT "DeviceUserLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
