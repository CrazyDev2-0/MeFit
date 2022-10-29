-- AlterTable
ALTER TABLE "PersonalizedMonitoring" ADD COLUMN     "doctorId" TEXT;

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFCMToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserFCMToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorFCMToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,

    CONSTRAINT "DoctorFCMToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_email_key" ON "Doctor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserFCMToken_token_key" ON "UserFCMToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorFCMToken_token_key" ON "DoctorFCMToken"("token");

-- AddForeignKey
ALTER TABLE "PersonalizedMonitoring" ADD CONSTRAINT "PersonalizedMonitoring_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFCMToken" ADD CONSTRAINT "UserFCMToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorFCMToken" ADD CONSTRAINT "DoctorFCMToken_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
