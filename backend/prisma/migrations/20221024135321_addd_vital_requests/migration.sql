-- CreateTable
CREATE TABLE "VitalRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "requestedOn" BIGINT NOT NULL,

    CONSTRAINT "VitalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VitalToVitalRequest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_VitalToVitalRequest_AB_unique" ON "_VitalToVitalRequest"("A", "B");

-- CreateIndex
CREATE INDEX "_VitalToVitalRequest_B_index" ON "_VitalToVitalRequest"("B");

-- AddForeignKey
ALTER TABLE "VitalRequest" ADD CONSTRAINT "VitalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VitalToVitalRequest" ADD CONSTRAINT "_VitalToVitalRequest_A_fkey" FOREIGN KEY ("A") REFERENCES "Vital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VitalToVitalRequest" ADD CONSTRAINT "_VitalToVitalRequest_B_fkey" FOREIGN KEY ("B") REFERENCES "VitalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
