/*
  Warnings:

  - Added the required column `name` to the `PredictionModelParam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vitalCode` to the `PredictionModelParam` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PredictionModelParam" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "vitalCode" TEXT NOT NULL;
