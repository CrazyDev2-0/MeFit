/*
  Warnings:

  - You are about to drop the column `isCalorieCount` on the `PersonalizedMonitoring` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PersonalizedMonitoring" DROP COLUMN "isCalorieCount",
ADD COLUMN     "isMonitorCalorieCount" BOOLEAN NOT NULL DEFAULT false;
