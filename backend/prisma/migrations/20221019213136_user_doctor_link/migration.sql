-- CreateTable
CREATE TABLE "_DoctorToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DoctorToUser_AB_unique" ON "_DoctorToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_DoctorToUser_B_index" ON "_DoctorToUser"("B");

-- AddForeignKey
ALTER TABLE "_DoctorToUser" ADD CONSTRAINT "_DoctorToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DoctorToUser" ADD CONSTRAINT "_DoctorToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
