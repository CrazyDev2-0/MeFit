/*
  Warnings:

  - You are about to drop the `_DoctorToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DoctorToUser" DROP CONSTRAINT "_DoctorToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_DoctorToUser" DROP CONSTRAINT "_DoctorToUser_B_fkey";

-- DropTable
DROP TABLE "_DoctorToUser";

-- CreateTable
CREATE TABLE "PatientDataAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PatientDataAccess_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PatientDataAccess" ADD CONSTRAINT "PatientDataAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDataAccess" ADD CONSTRAINT "PatientDataAccess_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
