/*
  Warnings:

  - You are about to drop the column `diseaseId` on the `PersonalizedMonitoring` table. All the data in the column will be lost.
  - Added the required column `description` to the `PersonalizedMonitoring` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `PersonalizedMonitoring` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PersonalizedMonitoring" DROP CONSTRAINT "PersonalizedMonitoring_diseaseId_fkey";

-- AlterTable
ALTER TABLE "PersonalizedMonitoring" DROP COLUMN "diseaseId",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;
