/*
  Warnings:

  - You are about to drop the `DisorderHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FamilyHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DisorderHistory" DROP CONSTRAINT "DisorderHistory_diseaseId_fkey";

-- DropForeignKey
ALTER TABLE "DisorderHistory" DROP CONSTRAINT "DisorderHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "FamilyHistory" DROP CONSTRAINT "FamilyHistory_diseaseId_fkey";

-- DropForeignKey
ALTER TABLE "FamilyHistory" DROP CONSTRAINT "FamilyHistory_userId_fkey";

-- DropTable
DROP TABLE "DisorderHistory";

-- DropTable
DROP TABLE "FamilyHistory";
