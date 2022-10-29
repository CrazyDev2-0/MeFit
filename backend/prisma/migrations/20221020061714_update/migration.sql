/*
  Warnings:

  - Added the required column `email` to the `EmergencyContact` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmergencyContact" ADD COLUMN     "email" TEXT NOT NULL;
