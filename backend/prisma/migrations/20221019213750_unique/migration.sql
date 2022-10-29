/*
  Warnings:

  - A unique constraint covering the columns `[userId,doctorId]` on the table `PatientDataAccess` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PatientDataAccess_userId_doctorId_key" ON "PatientDataAccess"("userId", "doctorId");
