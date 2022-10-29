/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Vital` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Vital` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vital" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Vital_code_key" ON "Vital"("code");
